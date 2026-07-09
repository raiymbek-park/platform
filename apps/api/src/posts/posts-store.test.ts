import type { PostUpdateInput } from '@raiymbek-park/shared/validation-schemas'

import { beforeEach, expect, test, vi } from 'vitest'

const state = vi.hoisted(() => {
  const data: Record<string, unknown> = {}
  return { data, exists: true }
})

const updateSpy = vi.hoisted(() => vi.fn())
const deleteSpy = vi.hoisted(() => vi.fn())

vi.mock('../firestore', () => {
  const transaction = {
    delete: deleteSpy,
    get: () =>
      Promise.resolve({ data: () => state.data, exists: state.exists }),
    update: updateSpy,
  }
  return {
    getDb: () => ({
      collection: () => ({ doc: () => ({}) }),
      runTransaction: (fn: (transaction: unknown) => Promise<unknown>) =>
        fn(transaction),
    }),
  }
})

vi.mock('../storage', () => ({
  deletePostMedia: vi.fn().mockResolvedValue(undefined),
}))

const { deletePost, updatePost } = await import('./posts-store')

const validUpdate: PostUpdateInput = {
  category: 'sell',
  description: 'Продаю велосипед в отличном состоянии, почти новый',
  id: 'post-1',
  kind: 'offer',
  media: [],
  title: 'Продам горный велосипед',
}

beforeEach(() => {
  state.data = { authorId: 'author-uid' }
  state.exists = true
  updateSpy.mockClear()
  deleteSpy.mockClear()
})

test('validation 9: the author can update their own post', async () => {
  await expect(updatePost('author-uid', 'resident', validUpdate)).resolves.toBe(
    'ok',
  )
  expect(updateSpy).toHaveBeenCalledTimes(1)
})

test('validation 9: a non-author, non-administration member cannot update another member’s post', async () => {
  await expect(
    updatePost('another-uid', 'resident', validUpdate),
  ).resolves.toBe('forbidden')
  expect(updateSpy).not.toHaveBeenCalled()
})

test('happy-path 12: Administration can update a post authored by someone else', async () => {
  await expect(
    updatePost('admin-uid', 'administration', validUpdate),
  ).resolves.toBe('ok')
  expect(updateSpy).toHaveBeenCalledTimes(1)
})

test('validation 9: updating a post that no longer exists reports not-found', async () => {
  state.exists = false
  await expect(updatePost('author-uid', 'resident', validUpdate)).resolves.toBe(
    'not-found',
  )
  expect(updateSpy).not.toHaveBeenCalled()
})

test('validation 9: the author can delete their own post', async () => {
  await expect(deletePost('author-uid', 'resident', 'post-1')).resolves.toBe(
    'ok',
  )
  expect(deleteSpy).toHaveBeenCalledTimes(1)
})

test('validation 9: a non-author, non-administration member cannot delete another member’s post', async () => {
  await expect(deletePost('another-uid', 'resident', 'post-1')).resolves.toBe(
    'forbidden',
  )
  expect(deleteSpy).not.toHaveBeenCalled()
})

test('happy-path 12: Administration can delete a post authored by someone else regardless of authorship', async () => {
  await expect(
    deletePost('admin-uid', 'administration', 'post-1'),
  ).resolves.toBe('ok')
  expect(deleteSpy).toHaveBeenCalledTimes(1)
})

test('validation 9: deleting a post that no longer exists reports not-found', async () => {
  state.exists = false
  await expect(deletePost('author-uid', 'resident', 'post-1')).resolves.toBe(
    'not-found',
  )
  expect(deleteSpy).not.toHaveBeenCalled()
})
