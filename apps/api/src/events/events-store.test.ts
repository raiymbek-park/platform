import { beforeEach, expect, test, vi } from 'vitest'

type FakeDoc = {
  data: Record<string, unknown>
  id: string
}

type Filter = [string, string, unknown]

type FakeSnap = {
  data: () => Record<string, unknown>
  id: string
}

type FakeQuery = {
  get: () => Promise<{ docs: FakeSnap[] }>
  limit: (size: number) => FakeQuery
  orderBy: (field: string) => FakeQuery
  where: (field: string, op: string, value: unknown) => FakeQuery
}

const state = vi.hoisted(() => {
  const issues: FakeDoc[] = []
  const posts: FakeDoc[] = []
  const watches: Record<string, string[]> = {}
  return { issues, posts, watches }
})

vi.mock('../firestore', async () => {
  const { FieldValue, Timestamp } = await vi.importActual<
    typeof import('firebase-admin/firestore')
  >('firebase-admin/firestore')

  const millis = (value: unknown): number =>
    value instanceof Timestamp ? value.toMillis() : 0

  const matches = (doc: FakeDoc, [field, op, value]: Filter): boolean => {
    if (op === '==') return doc.data[field] === value
    if (op === '>=') return millis(doc.data[field]) >= millis(value)
    return millis(doc.data[field]) > millis(value)
  }

  const snap = (doc: FakeDoc): FakeSnap => ({
    data: () => doc.data,
    id: doc.id,
  })

  const query = (
    source: () => FakeDoc[],
    filters: Filter[],
    order: string | null,
    max: number,
  ): FakeQuery => ({
    get: () => {
      const kept = source().filter(doc =>
        filters.every(filter => matches(doc, filter)),
      )
      const ordered = order
        ? [...kept].sort(
            (a, b) => millis(b.data[order]) - millis(a.data[order]),
          )
        : kept
      return Promise.resolve({ docs: ordered.slice(0, max).map(snap) })
    },
    limit: size => query(source, filters, order, size),
    orderBy: field => query(source, filters, field, max),
    where: (field, op, value) =>
      query(source, [...filters, [field, op, value]], order, max),
  })

  const source = (name: string) => () =>
    name === 'posts' ? state.posts : state.issues

  const watchDocs = (uid: string) =>
    (state.watches[uid] ?? []).map(issueId => ({ id: issueId }))

  return {
    FieldValue,
    Timestamp,
    getDb: () => ({
      collection: (name: string) => ({
        ...query(source(name), [], null, Number.POSITIVE_INFINITY),
        doc: (id: string) => ({
          collection: () => ({
            get: () => Promise.resolve({ docs: watchDocs(id) }),
          }),
          id,
        }),
      }),
      getAll: (...refs: { id: string }[]) =>
        Promise.resolve(
          refs.map(ref => {
            const found = state.issues.find(doc => doc.id === ref.id)
            return { data: () => found?.data, id: ref.id }
          }),
        ),
    }),
  }
})

const { Timestamp } = await import('../firestore')
const { getEvents } = await import('./events-store')

const at = (millis: number) => Timestamp.fromMillis(millis)

const announcement = (
  id: string,
  title: string,
  createdAt: number,
  authorId = 'author-uid',
): FakeDoc => ({
  data: {
    authorId,
    category: 'complex',
    createdAt: at(createdAt),
    kind: 'announcement',
    title,
  },
  id,
})

const offer = (
  id: string,
  title: string,
  createdAt: number,
  authorId = 'author-uid',
): FakeDoc => ({
  data: {
    authorId,
    category: 'sell',
    createdAt: at(createdAt),
    kind: 'offer',
    title,
  },
  id,
})

const issue = (
  id: string,
  number: number,
  activity: Record<string, unknown>,
): FakeDoc => ({
  data: { number, status: 'in-progress', ...activity },
  id,
})

beforeEach(() => {
  state.issues = []
  state.posts = []
  state.watches = {}
})

test('happy-path 9: the window holds the announcement, the offer, the followed issue’s status change and another resident’s comment, newest first', async () => {
  state.posts = [
    announcement('post-1', 'Отключение воды 15 июля', 100),
    offer('offer-1', 'Продам самокат', 200),
  ]
  state.issues = [
    issue('issue-14', 14, {
      lastCommentAt: at(400),
      lastCommentBy: 'author-uid',
      lastStatusAt: at(300),
      lastStatusBy: 'manager-uid',
    }),
  ]
  state.watches = { 'uid-a': ['issue-14'] }

  const events = await getEvents('uid-a', 'resident', at(50))

  expect(events).toEqual([
    { createdAt: 400, issueId: 'issue-14', number: 14, type: 'issue-comment' },
    {
      createdAt: 300,
      issueId: 'issue-14',
      number: 14,
      status: 'in-progress',
      type: 'issue-status',
    },
    {
      category: 'sell',
      createdAt: 200,
      id: 'offer-1',
      title: 'Продам самокат',
      type: 'offer',
    },
    {
      category: 'complex',
      createdAt: 100,
      id: 'post-1',
      title: 'Отключение воды 15 июля',
      type: 'announcement',
    },
  ])
})

test('happy-path 10: a manager’s window holds status changes and comments on issues they do not follow', async () => {
  state.issues = [
    issue('issue-14', 14, {
      lastCommentAt: at(400),
      lastCommentBy: 'author-uid',
      lastStatusAt: at(300),
      lastStatusBy: 'author-uid',
    }),
  ]

  const events = await getEvents('manager-uid', 'manager', at(50))

  expect(events).toEqual([
    { createdAt: 400, issueId: 'issue-14', number: 14, type: 'issue-comment' },
    {
      createdAt: 300,
      issueId: 'issue-14',
      number: 14,
      status: 'in-progress',
      type: 'issue-status',
    },
  ])
})

test('validation 5: a resident who does not follow the issue has its status change kept out of their window', async () => {
  state.issues = [
    issue('issue-14', 14, {
      lastStatusAt: at(300),
      lastStatusBy: 'author-uid',
    }),
  ]

  await expect(getEvents('uid-a', 'resident', at(50))).resolves.toEqual([])
})

test('validation 4: a resident’s own offer, own comment and the issue they opened leave their window empty', async () => {
  state.posts = [offer('offer-1', 'Продам самокат', 200, 'uid-a')]
  state.issues = [
    issue('issue-14', 14, { lastCommentAt: at(300), lastCommentBy: 'uid-a' }),
    issue('issue-20', 20, { status: 'new' }),
  ]
  state.watches = { 'uid-a': ['issue-14', 'issue-20'] }

  await expect(getEvents('uid-a', 'resident', at(50))).resolves.toEqual([])
})

test('validation 4: a manager’s own status change and own comment are kept out of their own window', async () => {
  state.issues = [
    issue('issue-14', 14, {
      lastCommentAt: at(400),
      lastCommentBy: 'manager-uid',
      lastStatusAt: at(300),
      lastStatusBy: 'manager-uid',
    }),
  ]

  await expect(getEvents('manager-uid', 'manager', at(50))).resolves.toEqual([])
})

test('happy-path 10: administration receives issue activity across issues they do not follow', async () => {
  state.issues = [
    issue('issue-14', 14, {
      lastStatusAt: at(300),
      lastStatusBy: 'author-uid',
    }),
  ]

  await expect(
    getEvents('admin-uid', 'administration', at(50)),
  ).resolves.toEqual([
    {
      createdAt: 300,
      issueId: 'issue-14',
      number: 14,
      status: 'in-progress',
      type: 'issue-status',
    },
  ])
})

test('validation 1: an announcement dated before the anchor stays out of the window', async () => {
  state.posts = [
    announcement('post-old', 'Старое объявление', 11_000),
    announcement('post-new', 'Новое объявление', 13_000),
  ]

  await expect(getEvents('uid-a', 'resident', at(12_000))).resolves.toEqual([
    {
      category: 'complex',
      createdAt: 13_000,
      id: 'post-new',
      title: 'Новое объявление',
      type: 'announcement',
    },
  ])
})

test('validation 2: a comment on a followed issue dated before the anchor is not pushed', async () => {
  state.issues = [
    issue('issue-14', 14, {
      lastCommentAt: at(13_000),
      lastCommentBy: 'author-uid',
      lastStatusAt: at(11_000),
      lastStatusBy: 'manager-uid',
    }),
  ]
  state.watches = { 'uid-a': ['issue-14'] }

  await expect(getEvents('uid-a', 'resident', at(12_000))).resolves.toEqual([
    {
      createdAt: 13_000,
      issueId: 'issue-14',
      number: 14,
      type: 'issue-comment',
    },
  ])
})

test('validation 3: an announcement dated exactly at the anchor is not pushed again', async () => {
  state.posts = [announcement('post-1', 'Отключение воды 15 июля', 12_000)]

  await expect(getEvents('uid-a', 'resident', at(12_000))).resolves.toEqual([])
})

test('validation 3: a status change and a comment dated exactly at the anchor are not pushed again', async () => {
  state.issues = [
    issue('issue-14', 14, {
      lastCommentAt: at(12_000),
      lastCommentBy: 'author-uid',
      lastStatusAt: at(12_000),
      lastStatusBy: 'manager-uid',
    }),
  ]
  state.watches = { 'uid-a': ['issue-14'] }

  await expect(getEvents('uid-a', 'resident', at(12_000))).resolves.toEqual([])
})

test('validation 3: a manager’s issue activity dated exactly at the anchor is not pushed again', async () => {
  state.issues = [
    issue('issue-14', 14, {
      lastCommentAt: at(12_000),
      lastCommentBy: 'author-uid',
      lastStatusAt: at(12_000),
      lastStatusBy: 'author-uid',
    }),
  ]

  await expect(
    getEvents('manager-uid', 'manager', at(12_000)),
  ).resolves.toEqual([])
})

test('validation 7: announcements and offers together are capped at ten events', async () => {
  state.posts = [
    ...Array.from({ length: 8 }, (_, index) =>
      announcement(`post-${index}`, `Объявление ${index}`, 100 + index),
    ),
    ...Array.from({ length: 8 }, (_, index) =>
      offer(`offer-${index}`, `Предложение ${index}`, 200 + index),
    ),
  ]

  const events = await getEvents('uid-a', 'resident', at(50))

  expect(events).toHaveLength(10)
  expect(events[0]).toMatchObject({ title: 'Предложение 7' })
})

test('validation 7: a window of fourteen events reports the ten newest', async () => {
  state.posts = Array.from({ length: 14 }, (_, index) =>
    announcement(`post-${index}`, `Событие ${index}`, 100 + index),
  )

  const events = await getEvents('uid-a', 'resident', at(50))

  expect(events).toHaveLength(10)
  expect(events[0]).toMatchObject({ title: 'Событие 13' })
  expect(events[9]).toMatchObject({ title: 'Событие 4' })
})

test('edge-cases 5: a resident with no anchor reads the most recent activity, capped at ten events', async () => {
  state.posts = Array.from({ length: 12 }, (_, index) =>
    announcement(`post-${index}`, `Событие ${index}`, 100 + index),
  )

  const events = await getEvents('uid-a', 'resident', null)

  expect(events).toHaveLength(10)
  expect(events[0]).toMatchObject({ title: 'Событие 11' })
})

test('edge-cases 10: a post whose author cannot be resolved still counts and is named by its title', async () => {
  state.posts = [
    {
      data: {
        category: 'complex',
        createdAt: at(300),
        kind: 'announcement',
        title: 'Отключение воды 15 июля',
      },
      id: 'post-1',
    },
  ]

  await expect(getEvents('uid-a', 'resident', at(50))).resolves.toEqual([
    {
      category: 'complex',
      createdAt: 300,
      id: 'post-1',
      title: 'Отключение воды 15 июля',
      type: 'announcement',
    },
  ])
})

test('edge-cases 12: a viewer’s window holds the new announcement', async () => {
  state.posts = [announcement('post-1', 'Отключение воды 15 июля', 300)]

  await expect(getEvents('uid-a', 'viewer', at(50))).resolves.toEqual([
    {
      category: 'complex',
      createdAt: 300,
      id: 'post-1',
      title: 'Отключение воды 15 июля',
      type: 'announcement',
    },
  ])
})
