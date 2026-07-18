import { beforeEach, expect, test, vi } from 'vitest'

const state = vi.hoisted(() => ({
  updates: [] as Record<string, unknown>[],
  writes: [] as Array<{ data: Record<string, unknown>; path: string }>,
}))

vi.mock('../firestore', () => {
  const issueRef = {
    collection: (name: string) => ({ doc: () => ({ path: `${name}/new` }) }),
  }
  const transaction = {
    get: () => Promise.resolve({ exists: true }),
    set: (ref: { path: string }, data: Record<string, unknown>) => {
      state.writes.push({ data, path: ref.path })
    },
    update: (_ref: unknown, data: Record<string, unknown>) => {
      state.updates.push(data)
    },
  }
  return {
    FieldValue: {
      increment: (by: number) => ({ increment: by }),
      serverTimestamp: () => 'server-time',
    },
    Timestamp: class {},
    getDb: () => ({
      collection: () => ({ doc: () => issueRef }),
      runTransaction: (run: (tx: typeof transaction) => Promise<unknown>) =>
        run(transaction),
    }),
  }
})

const getResident = vi.hoisted(() =>
  vi.fn(async () => ({
    apartment: 60,
    block: 1,
    name: 'Киану Ривз',
    phone: '+77781234455',
    role: 'administration',
  })),
)

vi.mock('../resident/resident-store', () => ({
  getResident,
  residentSnapshot: (resident: Record<string, unknown> | null) => resident,
}))

const { changeStatus } = await import('./issues-store')

beforeEach(() => {
  state.updates = []
  state.writes = []
  getResident.mockClear()
})

test('a status change with a comment mirrors it into the comments thread and increments the count', async () => {
  const done = await changeStatus('admin-uid', {
    comment: 'Охранник больше не работает на объекте.',
    issueId: 'issue-1',
    media: ['https://example.com/photo.jpg'],
    status: 'done',
    tags: [],
  })

  expect(done).toBe(true)
  expect(state.updates[0]).toMatchObject({
    commentCount: { increment: 1 },
    status: 'done',
  })
  const comment = state.writes.find(write => write.path === 'comments/new')
  expect(comment?.data).toEqual({
    author: { apartment: 60, block: 1, name: 'Киану Ривз' },
    authorId: 'admin-uid',
    createdAt: 'server-time',
    media: ['https://example.com/photo.jpg'],
    text: 'Охранник больше не работает на объекте.',
  })
})

test('a status change without a comment leaves the thread and the count untouched', async () => {
  const done = await changeStatus('admin-uid', {
    comment: '',
    issueId: 'issue-1',
    media: [],
    status: 'in-progress',
    tags: [],
  })

  expect(done).toBe(true)
  expect(state.updates[0]).not.toHaveProperty('commentCount')
  expect(state.writes.map(write => write.path)).toEqual(['statusChanges/new'])
  expect(getResident).not.toHaveBeenCalled()
})
