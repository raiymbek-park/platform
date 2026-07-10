import { beforeEach, expect, test, vi } from 'vitest'

const state = vi.hoisted(() => ({
  createSpy: vi.fn(),
  doc: null as { data: Record<string, unknown> } | null,
  incrementCalls: [] as unknown[],
  updateSpy: vi.fn(),
}))

vi.mock('../firestore', () => {
  const transaction = {
    create: (_ref: unknown, data: Record<string, unknown>) => {
      state.createSpy(data)
    },
    get: () => Promise.resolve({ exists: true }),
    update: (_ref: unknown, data: Record<string, unknown>) => {
      state.incrementCalls.push(data)
    },
  }
  const commentDocRef = {
    collection: () => ({ doc: () => commentDocRef }),
    get: () =>
      Promise.resolve({
        data: () => state.doc?.data,
        exists: state.doc !== null,
      }),
    update: (data: Record<string, unknown>) => {
      state.updateSpy(data)
      if (state.doc) state.doc = { data: { ...state.doc.data, ...data } }
      return Promise.resolve()
    },
  }
  const parentRef = { collection: () => ({ doc: () => commentDocRef }) }
  return {
    FieldValue: {
      increment: (by: number) => ({ increment: by }),
      serverTimestamp: () => 'server-time',
    },
    getDb: () => ({
      collection: () => ({ doc: () => parentRef }),
      runTransaction: (run: (tx: typeof transaction) => Promise<unknown>) =>
        run(transaction),
    }),
  }
})

vi.mock('../resident/resident-store', () => ({
  getResident: vi.fn(async () => ({
    apartment: 42,
    block: 1,
    name: 'Алиса',
    phone: '+7 700 000 00 00',
  })),
}))

vi.mock('../translation/translation-client', () => ({
  translateText: vi.fn(),
}))

const { createComment, translateComment } = await import('./comments-store')
const { translateText } = await import('../translation/translation-client')

const mockTranslateText = vi.mocked(translateText)

const target = { parent: 'issue' as const, parentId: 'issue-1' }

beforeEach(() => {
  state.doc = null
  state.incrementCalls = []
  state.createSpy.mockClear()
  state.updateSpy.mockClear()
  mockTranslateText.mockReset()
})

test('happy-path 5: createComment records the author’s active locale as the recorded source language', async () => {
  await createComment('uid-1', 'kk', {
    ...target,
    id: 'comment-1',
    media: [],
    text: 'Сәлем',
  })

  expect(state.createSpy).toHaveBeenCalledWith(
    expect.objectContaining({ lang: 'kk' }),
  )
})

test('happy-path 6: a cached translation is reused with no new AI translation call', async () => {
  state.doc = {
    data: {
      lang: 'ru',
      text: 'Отличное предложение',
      translations: { en: { text: 'Great offer' } },
    },
  }

  const result = await translateComment('en', { ...target, id: 'comment-1' })

  expect(result).toEqual({ lang: 'ru', text: 'Great offer' })
  expect(mockTranslateText).not.toHaveBeenCalled()
})

test('happy-path 5: an on-demand translate calls the provider on a cache miss and caches the result', async () => {
  state.doc = { data: { lang: 'ru', text: 'Отличное предложение' } }
  mockTranslateText.mockResolvedValueOnce({
    lang: 'ru',
    translations: {
      en: { text: 'Great offer' },
      kk: { text: 'Тамаша ұсыныс' },
    },
  })

  const result = await translateComment('en', { ...target, id: 'comment-1' })

  expect(result).toEqual({ lang: 'ru', text: 'Great offer' })
  expect(state.updateSpy).toHaveBeenCalledWith({
    lang: 'ru',
    translations: {
      en: { text: 'Great offer' },
      kk: { text: 'Тамаша ұсыныс' },
    },
  })
})

test('edge-cases 4: a translate corrects a wrongly recorded source language', async () => {
  state.doc = { data: { lang: 'kk', text: 'Отличное предложение' } }
  mockTranslateText.mockResolvedValueOnce({
    lang: 'ru',
    translations: {
      en: { text: 'Great offer' },
      kk: { text: 'Тамаша ұсыныс' },
    },
  })

  const result = await translateComment('ru', { ...target, id: 'comment-1' })

  expect(result).toEqual({ lang: 'ru', text: 'Отличное предложение' })
  expect(state.updateSpy).toHaveBeenCalledWith(
    expect.objectContaining({ lang: 'ru' }),
  )
})

test('error-states 2: a provider failure reports failed and leaves the comment untouched', async () => {
  state.doc = { data: { lang: 'ru', text: 'Отличное предложение' } }
  mockTranslateText.mockResolvedValueOnce(null)

  const result = await translateComment('en', { ...target, id: 'comment-1' })

  expect(result).toBe('failed')
  expect(state.updateSpy).not.toHaveBeenCalled()
})

test('a translate request for a comment that no longer exists reports not-found', async () => {
  state.doc = null

  const result = await translateComment('en', { ...target, id: 'missing' })

  expect(result).toBe('not-found')
})
