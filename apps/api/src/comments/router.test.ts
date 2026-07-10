import { expect, test, vi } from 'vitest'

import { getRole } from '../resident/resident-store'
import { createComment, translateComment } from './comments-store'
import { commentsRouter } from './router'

vi.mock('../resident/resident-store', () => ({ getRole: vi.fn() }))
vi.mock('./comments-store', () => ({
  createComment: vi.fn(),
  deleteComment: vi.fn(),
  listComments: vi.fn(),
  translateComment: vi.fn(),
  updateComment: vi.fn(),
}))

const mockGetRole = vi.mocked(getRole)
const mockCreateComment = vi.mocked(createComment)
const mockTranslateComment = vi.mocked(translateComment)

const caller = (uid: string | null) =>
  commentsRouter.createCaller({ locale: 'en', phone: null, uid })

const translateInput = {
  id: 'comment-1',
  parent: 'issue' as const,
  parentId: 'issue-1',
}

test('error-states 2: translate rejects an unauthenticated caller with UNAUTHORIZED', async () => {
  await expect(caller(null).translate(translateInput)).rejects.toMatchObject({
    code: 'UNAUTHORIZED',
  })
})

test('happy-path 5: translate returns the resolved translation for an authenticated caller', async () => {
  mockTranslateComment.mockResolvedValueOnce({
    lang: 'ru',
    text: 'Great offer',
  })

  await expect(caller('uid-1').translate(translateInput)).resolves.toEqual({
    lang: 'ru',
    text: 'Great offer',
  })
})

test('translate surfaces NOT_FOUND with the localized commentNotFound message', async () => {
  mockTranslateComment.mockResolvedValueOnce('not-found')

  await expect(caller('uid-1').translate(translateInput)).rejects.toMatchObject(
    { code: 'NOT_FOUND', message: 'commentNotFound' },
  )
})

test('error-states 2: translate surfaces INTERNAL_SERVER_ERROR with the localized commentTranslateFailed message on provider failure', async () => {
  mockTranslateComment.mockResolvedValueOnce('failed')

  await expect(caller('uid-1').translate(translateInput)).rejects.toMatchObject(
    { code: 'INTERNAL_SERVER_ERROR', message: 'commentTranslateFailed' },
  )
})

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
