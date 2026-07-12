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
    set: () => {},
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

const { createComment } = await import('./comments-store')

const target = { parent: 'issue' as const, parentId: 'issue-1' }

beforeEach(() => {
  state.doc = null
  state.incrementCalls = []
  state.createSpy.mockClear()
  state.updateSpy.mockClear()
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
