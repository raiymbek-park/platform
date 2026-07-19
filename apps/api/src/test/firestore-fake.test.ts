import { beforeEach, expect, test, vi } from 'vitest'

import { fake } from './firestore-fake'

vi.mock('../firestore', async () => {
  const module = await import('./firestore-fake')
  const { Timestamp } = await import('firebase-admin/firestore')
  return {
    getDb: () => module.fake.db,
    FieldValue: module.FieldValue,
    Timestamp,
  }
})

vi.mock('../storage', () => ({
  deleteIssueMedia: () => Promise.resolve(),
}))

const { changeStatus, createIssue, listIssues } = await import(
  '../issues/issues-store'
)

const seedAdministrator = () =>
  fake.seed('residents/uid-1', {
    apartment: 60,
    block: 1,
    name: 'Киану Ривз',
    phone: '+77781234455',
    role: 'administration',
  })

const createPayload = {
  category: 'repair' as const,
  description: 'Течёт кран на кухне, нужен мастер',
  id: 'issue-1',
  media: [],
  title: 'Течёт кран',
  urgent: false,
}

beforeEach(() => {
  fake.reset()
  seedAdministrator()
})

test('the real create + list path runs against the fake: an issue is stored and read back with server-computed fields', async () => {
  const { number } = await createIssue('uid-1', 'ru', createPayload)
  expect(number).toBe(1)

  const { issues } = await listIssues({
    locale: 'ru',
    role: 'administration',
    status: 'all',
    uid: 'uid-1',
  })

  expect(issues).toHaveLength(1)
  expect(issues[0]).toMatchObject({
    author: { name: 'Киану Ривз' },
    id: 'issue-1',
    isMine: true,
    isWatching: true,
    number: 1,
    status: 'new',
    title: 'Течёт кран',
  })
})

test('the real status-change path mirrors a comment and increments the count through the fake transaction', async () => {
  await createIssue('uid-1', 'ru', createPayload)

  const ok = await changeStatus('uid-1', {
    comment: 'Взяли в работу, назначен мастер',
    issueId: 'issue-1',
    media: [],
    status: 'in-progress',
    tags: ['warranty'],
  })
  expect(ok).toBe(true)

  expect(fake.getDoc('issues/issue-1')).toMatchObject({
    commentCount: 1,
    lastStatusBy: 'uid-1',
    status: 'in-progress',
    tags: ['warranty'],
  })

  const statusChanges = fake.listDocs('issues/issue-1/statusChanges')
  expect(statusChanges).toHaveLength(1)
  expect(statusChanges[0]).toMatchObject({
    comment: 'Взяли в работу, назначен мастер',
    status: 'in-progress',
  })

  const comments = fake.listDocs('issues/issue-1/comments')
  expect(comments).toHaveLength(1)
  expect(comments[0]).toMatchObject({ text: 'Взяли в работу, назначен мастер' })
})

test('a collection-group query spans subcollections and its docs expose the owning parent', async () => {
  const { registerPushToken, getResidentTokens } = await import(
    '../notifications/push-token-store'
  )

  await registerPushToken('uid-1', 'token-a', 'ru')
  await registerPushToken('uid-2', 'token-a', 'kk')

  expect(fake.getDoc('residents/uid-1/pushTokens/token-a')).toBeUndefined()
  expect(await getResidentTokens('uid-2')).toEqual([
    { locale: 'kk', token: 'token-a' },
  ])
})

test('a status change with no comment leaves the comment thread empty and the count at zero', async () => {
  await createIssue('uid-1', 'ru', createPayload)

  await changeStatus('uid-1', {
    issueId: 'issue-1',
    media: [],
    status: 'planned',
    tags: [],
  })

  expect(fake.getDoc('issues/issue-1')).toMatchObject({ status: 'planned' })
  expect(fake.getDoc('issues/issue-1')?.commentCount).toBe(0)
  expect(fake.listDocs('issues/issue-1/comments')).toHaveLength(0)
})
