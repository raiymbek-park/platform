import type {
  PostCreatePayload,
  PostUpdateInput,
} from '@raiymbek-park/shared/validation-schemas'

import { describe, expect, it, vi } from 'vitest'

import { getRole } from '../resident/resident-store'
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  setPostReaction,
  updatePost,
} from './posts-store'
import { postsRouter } from './router'

vi.mock('../resident/resident-store', () => ({ getRole: vi.fn() }))
vi.mock('./posts-store', () => ({
  createPost: vi.fn(),
  deletePost: vi.fn(),
  getPost: vi.fn(),
  listPosts: vi.fn(),
  setPostReaction: vi.fn(),
  updatePost: vi.fn(),
}))

const mockGetRole = vi.mocked(getRole)
const mockCreatePost = vi.mocked(createPost)
const mockUpdatePost = vi.mocked(updatePost)
const mockDeletePost = vi.mocked(deletePost)

const caller = (uid: string | null) =>
  postsRouter.createCaller({ locale: 'ru', phone: null, uid })

const offerPayload: PostCreatePayload = {
  category: 'sell',
  description: 'Продаю велосипед в отличном состоянии',
  id: 'post-1',
  kind: 'offer',
  media: [],
  title: 'Продам горный велосипед',
}

const announcementPayload: PostCreatePayload = {
  category: 'complex',
  description: 'Плановое отключение воды на всех этажах',
  id: 'post-2',
  kind: 'announcement',
  media: [],
  title: 'Отключение воды',
}

const updateInput: PostUpdateInput = offerPayload

describe('postsRouter.create — validation 9: server enforces post-kind permissions', () => {
  it('rejects a Viewer creating an offer with FORBIDDEN', async () => {
    mockGetRole.mockResolvedValueOnce('viewer')
    await expect(caller('uid-1').create(offerPayload)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('rejects a Resident creating an announcement with FORBIDDEN', async () => {
    mockGetRole.mockResolvedValueOnce('resident')
    await expect(
      caller('uid-1').create(announcementPayload),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('rejects a Manager creating an offer with FORBIDDEN', async () => {
    mockGetRole.mockResolvedValueOnce('manager')
    await expect(caller('uid-1').create(offerPayload)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('allows Administration to create either kind (happy-path 12)', async () => {
    mockGetRole.mockResolvedValueOnce('administration')
    mockCreatePost.mockResolvedValueOnce({ id: announcementPayload.id })
    await expect(
      caller('admin-uid').create(announcementPayload),
    ).resolves.toEqual({ id: announcementPayload.id })
  })
})

describe('postsRouter.update / delete — validation 9: server enforces ownership', () => {
  it('rejects update with UNAUTHORIZED when ctx.uid is null', async () => {
    await expect(caller(null).update(updateInput)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects update with FORBIDDEN for a non-author, non-administration member', async () => {
    mockGetRole.mockResolvedValueOnce('resident')
    mockUpdatePost.mockResolvedValueOnce('forbidden')
    await expect(caller('uid-2').update(updateInput)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('rejects delete with FORBIDDEN for a non-author, non-administration member', async () => {
    mockGetRole.mockResolvedValueOnce('resident')
    mockDeletePost.mockResolvedValueOnce('forbidden')
    await expect(
      caller('uid-2').delete({ postId: 'post-1' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('rejects delete with NOT_FOUND when the post does not exist', async () => {
    mockGetRole.mockResolvedValueOnce('resident')
    mockDeletePost.mockResolvedValueOnce('not-found')
    await expect(
      caller('uid-1').delete({ postId: 'post-1' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('allows Administration to edit a post authored by someone else (happy-path 12)', async () => {
    mockGetRole.mockResolvedValueOnce('administration')
    mockUpdatePost.mockResolvedValueOnce('ok')
    await expect(caller('admin-uid').update(updateInput)).resolves.toEqual({
      ok: true,
    })
  })
})

describe('postsRouter.get / list / react — unaffected by the create/edit/delete permission work', () => {
  it('surfaces a NOT_FOUND error when the post does not exist', async () => {
    vi.mocked(getPost).mockResolvedValueOnce(null)
    await expect(caller(null).get({ postId: 'missing' })).rejects.toMatchObject(
      { code: 'NOT_FOUND' },
    )
  })

  it('lists posts without requiring authentication', async () => {
    vi.mocked(listPosts).mockResolvedValueOnce({ nextCursor: null, posts: [] })
    await expect(caller(null).list({})).resolves.toEqual({
      nextCursor: null,
      posts: [],
    })
  })

  it('rejects a reaction from a Viewer', async () => {
    mockGetRole.mockResolvedValueOnce('viewer')
    await expect(
      caller('uid-1').react({ kind: 'like', postId: 'post-1' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(setPostReaction).not.toHaveBeenCalled()
  })
})
