import { expect, test, vi } from 'vitest'

import { getRole } from '../resident/resident-store'
import { createComment } from './comments-store'
import { commentsRouter } from './router'

vi.mock('../resident/resident-store', () => ({ getRole: vi.fn() }))
vi.mock('./comments-store', () => ({
  createComment: vi.fn(),
  deleteComment: vi.fn(),
  listComments: vi.fn(),
  updateComment: vi.fn(),
}))

const mockGetRole = vi.mocked(getRole)
const mockCreateComment = vi.mocked(createComment)

const caller = (uid: string | null) =>
  commentsRouter.createCaller({ locale: 'en', phone: null, uid })

test('create rejects a Viewer with FORBIDDEN', async () => {
  mockGetRole.mockResolvedValueOnce('viewer')

  await expect(
    caller('uid-1').create({
      id: 'comment-1',
      media: [],
      parent: 'post',
      parentId: 'post-1',
      text: 'Привет',
    }),
  ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  expect(mockCreateComment).not.toHaveBeenCalled()
})
