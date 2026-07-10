import type { PostCreatePayload } from '@raiymbek-park/shared/validation-schemas'

import { beforeEach, expect, test, vi } from 'vitest'

import { hashSource } from '../translation/hash-source'

const state = vi.hoisted(() => ({
  createSpy: vi.fn(),
  docs: [] as Array<{ id: string; data: Record<string, unknown> }>,
}))

vi.mock('../firestore', () => {
  class Timestamp {
    toMillis() {
      return 0
    }
    static fromMillis() {
      return new Timestamp()
    }
    static now() {
      return new Timestamp()
    }
  }
  const query = {
    get: () =>
      Promise.resolve({
        docs: state.docs.map(doc => ({ id: doc.id, data: () => doc.data })),
      }),
    limit: () => query,
    orderBy: () => query,
    startAfter: () => query,
    where: () => query,
  }
  return {
    FieldValue: { serverTimestamp: () => 'server-time' },
    Timestamp,
    getDb: () => ({
      collection: () => ({
        ...query,
        doc: (id: string) => ({
          create: (data: Record<string, unknown>) => {
            state.createSpy(id, data)
            return Promise.resolve()
          },
          get: () => {
            const doc = state.docs.find(entry => entry.id === id)
            return Promise.resolve({
              data: () => doc?.data ?? {},
              exists: doc !== undefined,
              id,
            })
          },
        }),
      }),
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
  residentSnapshot: (resident: {
    apartment: number
    block: number
    name: string
    phone: string
  }) => resident,
}))

const { createPost, getPost, listPosts } = await import('./posts-store')

const offerPayload: PostCreatePayload = {
  category: 'sell',
  description: 'Продаю велосипед в отличном состоянии',
  id: 'post-1',
  kind: 'offer',
  media: [],
  title: 'Продам горный велосипед',
}

beforeEach(() => {
  state.docs = []
  state.createSpy.mockClear()
})

test('happy-path 1: createPost records the author’s active locale as the initial source language', async () => {
  await createPost('uid-1', 'kk', offerPayload)

  expect(state.createSpy).toHaveBeenCalledWith(
    'post-1',
    expect.objectContaining({ lang: 'kk' }),
  )
})

test('happy-path 2: getPost substitutes the translation for the viewer’s locale and carries the original for the toggle', async () => {
  const title = 'Отключение воды'
  const description = 'Плановое отключение с 10:00'
  state.docs = [
    {
      data: {
        author: {},
        authorId: 'author-uid',
        description,
        keywords: [],
        kind: 'announcement',
        lang: 'ru',
        title,
        translatedRev: hashSource(title, description),
        translations: {
          kk: {
            description: 'Жоспарлы сумен өшіру 10:00-ден',
            title: 'Суды өшіру',
          },
        },
      },
      id: 'post-1',
    },
  ]

  const post = await getPost(null, 'kk', 'post-1')

  expect(post?.isTranslated).toBe(true)
  expect(post?.title).toBe('Суды өшіру')
  expect(post?.original).toEqual({ description, title })
})

test('happy-path 3: getPost shows the original with no indicator for a same-locale viewer', async () => {
  const title = 'Отключение воды'
  const description = 'Плановое отключение с 10:00'
  state.docs = [
    {
      data: {
        author: {},
        authorId: 'author-uid',
        description,
        keywords: [],
        kind: 'announcement',
        lang: 'ru',
        title,
      },
      id: 'post-1',
    },
  ]

  const post = await getPost(null, 'ru', 'post-1')

  expect(post?.isTranslated).toBe(false)
  expect(post?.original).toBeNull()
  expect(post?.title).toBe(title)
})

test('happy-path 1: listPosts threads the viewer’s locale into every returned card', async () => {
  const title = 'Отключение воды'
  const description = 'Плановое отключение с 10:00'
  state.docs = [
    {
      data: {
        author: {},
        authorId: 'author-uid',
        description,
        keywords: [],
        kind: 'announcement',
        lang: 'ru',
        title,
        translatedRev: hashSource(title, description),
        translations: {
          kk: {
            description: 'Жоспарлы сумен өшіру 10:00-ден',
            title: 'Суды өшіру',
          },
        },
      },
      id: 'post-1',
    },
  ]

  const { posts } = await listPosts({
    cursor: 1000,
    locale: 'kk',
    tab: 'all',
    uid: null,
  })

  expect(posts[0]?.title).toBe('Суды өшіру')
})
