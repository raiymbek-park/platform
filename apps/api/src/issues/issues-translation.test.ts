import type { IssueCreatePayload } from '@raiymbek-park/shared/validation-schemas'

import { beforeEach, expect, test, vi } from 'vitest'

import { hashSource } from '../translation/hash-source'

const state = vi.hoisted(() => ({
  counterValue: 100,
  docs: [] as Array<{ id: string; data: Record<string, unknown> }>,
  writes: [] as Array<{ data: Record<string, unknown>; id: string }>,
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
  const transaction = {
    create: (ref: { id: string }, data: Record<string, unknown>) => {
      state.writes.push({ data, id: ref.id })
    },
    get: (ref: { id: string }) =>
      Promise.resolve(
        ref.id === 'counters/issues'
          ? { data: () => ({ value: state.counterValue }) }
          : { data: () => ({}) },
      ),
    set: () => {},
  }
  return {
    FieldValue: { serverTimestamp: () => 'server-time' },
    Timestamp,
    getDb: () => ({
      collection: (name: string) => ({
        ...query,
        doc: (id?: string) => ({
          collection: () => ({
            ...query,
            doc: (subId?: string) => ({ id: subId }),
          }),
          id: id ?? `${name}/issues`,
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
  residentSnapshot: (resident: {
    apartment: number
    block: number
    name: string
    phone: string
  }) => resident,
}))

const { createIssue, getIssue, listIssues } = await import('./issues-store')

const payload: IssueCreatePayload = {
  category: 'other',
  description: 'Домофон у подъезда не открывает дверь по ключу',
  id: 'issue-1',
  media: [],
  title: 'Не работает домофон',
  urgent: false,
}

beforeEach(() => {
  state.docs = []
  state.writes = []
  state.counterValue = 100
})

test('happy-path 4: createIssue records the author’s active locale as the initial source language', async () => {
  await createIssue('uid-1', 'kk', payload)

  expect(state.writes[0]?.data).toMatchObject({ lang: 'kk' })
})

test('happy-path 4: getIssue substitutes the translation for the viewer’s locale, carrying the original for the toggle', async () => {
  const title = 'Не работает домофон'
  const description = 'Домофон у подъезда не открывает дверь по ключу'
  state.docs = [
    {
      data: {
        author: {},
        authorId: 'author-uid',
        description,
        keywords: [],
        lang: 'ru',
        number: 118,
        status: 'new',
        title,
        translatedRev: hashSource(title, description),
        translations: {
          kk: {
            description: 'Кіреберістегі домофон кілтпен есікті ашпайды',
            title: 'Домофон жұмыс істемейді',
          },
        },
      },
      id: 'issue-1',
    },
  ]

  const issue = await getIssue(null, null, 'kk', 'issue-1')

  expect(issue?.isTranslated).toBe(true)
  expect(issue?.title).toBe('Домофон жұмыс істемейді')
  expect(issue?.original).toEqual({ description, title })
})

test('happy-path 4: listIssues threads the viewer’s locale into every returned card', async () => {
  const title = 'Не работает домофон'
  const description = 'Домофон у подъезда не открывает дверь по ключу'
  state.docs = [
    {
      data: {
        author: {},
        authorId: 'author-uid',
        description,
        keywords: [],
        lang: 'ru',
        number: 118,
        status: 'new',
        title,
        translatedRev: hashSource(title, description),
        translations: {
          kk: {
            description: 'Кіреберістегі домофон кілтпен есікті ашпайды',
            title: 'Домофон жұмыс істемейді',
          },
        },
      },
      id: 'issue-1',
    },
  ]

  const { issues } = await listIssues({
    locale: 'kk',
    role: null,
    status: 'all',
    uid: null,
  })

  expect(issues[0]?.title).toBe('Домофон жұмыс істемейді')
})
