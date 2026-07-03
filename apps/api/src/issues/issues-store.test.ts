import type { PermissionRole } from '@raiymbek-park/shared/validation-schemas'

import { beforeEach, expect, test, vi } from 'vitest'

const state = vi.hoisted(() => ({
  docs: [] as Array<{ id: string; data: Record<string, unknown> }>,
}))

vi.mock('../firestore', () => {
  const query = {
    where: () => query,
    orderBy: () => query,
    startAfter: () => query,
    limit: () => query,
    get: () =>
      Promise.resolve({
        docs: state.docs.map(doc => ({ id: doc.id, data: () => doc.data })),
      }),
  }
  class Timestamp {
    toMillis() {
      return 0
    }
    static fromMillis() {
      return new Timestamp()
    }
  }
  return { Timestamp, getDb: () => ({ collection: () => query }) }
})

const { listIssues } = await import('./issues-store')

const doc = {
  id: 'issue-1',
  data: {
    author: { apartment: 12, block: 1, name: 'Житель', phone: '+77010000000' },
    authorId: 'author-uid',
    number: 118,
    status: 'new',
    title: 'Протечка трубы в подвале',
  },
}

const phoneFor = async (role: PermissionRole | null, uid: string | null) => {
  const { issues } = await listIssues({ role, status: 'all', uid })
  const [issue] = issues
  expect(issue).toBeDefined()
  return issue?.author.phone
}

beforeEach(() => {
  state.docs = [doc]
})

test('validation 21: a manager sees the author phone', async () => {
  expect(await phoneFor('manager', 'manager-uid')).toBe('+77010000000')
})

test('validation 21: administration sees the author phone', async () => {
  expect(await phoneFor('administration', 'admin-uid')).toBe('+77010000000')
})

test('validation 21: the author sees their own phone', async () => {
  expect(await phoneFor('resident', 'author-uid')).toBe('+77010000000')
})

test('validation 21: a resident who is not the author does not see the phone', async () => {
  expect(await phoneFor('resident', 'another-uid')).toBeUndefined()
})

test('validation 21: an anonymous request does not see the phone', async () => {
  expect(await phoneFor(null, null)).toBeUndefined()
})
