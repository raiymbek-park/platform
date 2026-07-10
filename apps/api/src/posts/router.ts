import {
  postCreatePayloadSchema,
  postListInputSchema,
  postReactionInputSchema,
  postRefInputSchema,
  postUpdateInputSchema,
} from '@raiymbek-park/shared/validation-schemas'
import { TRPCError } from '@trpc/server'

import { getRole } from '../resident/resident-store'
import { publicProcedure, router } from '../trpc'
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  setPostReaction,
  updatePost,
} from './posts-store'

const requireUid = (uid: string | null): string => {
  if (!uid) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'phoneNotVerified' })
  }
  return uid
}

export const postsRouter = router({
  list: publicProcedure.input(postListInputSchema).query(({ ctx, input }) =>
    listPosts({
      cursor: input.cursor,
      locale: ctx.locale,
      search: input.search,
      tab: input.tab,
      uid: ctx.uid,
    }),
  ),
  get: publicProcedure
    .input(postRefInputSchema)
    .query(async ({ ctx, input }) => {
      const post = await getPost(ctx.uid, ctx.locale, input.postId)
      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'postNotFound' })
      }
      return post
    }),
  react: publicProcedure
    .input(postReactionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const uid = requireUid(ctx.uid)
      const role = await getRole(uid)
      if (role === 'viewer') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'reactionForbidden',
        })
      }
      const updated = await setPostReaction(input.postId, uid, input.kind)
      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'postNotFound' })
      }
      return { ok: true }
    }),
  create: publicProcedure
    .input(postCreatePayloadSchema)
    .mutation(async ({ ctx, input }) => {
      const uid = requireUid(ctx.uid)
      const role = await getRole(uid)
      const allowed =
        input.kind === 'announcement'
          ? role === 'manager' || role === 'administration'
          : role === 'resident' || role === 'owner' || role === 'administration'
      if (!allowed) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'postCreateForbidden',
        })
      }
      return createPost(uid, ctx.locale, input)
    }),
  update: publicProcedure
    .input(postUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const uid = requireUid(ctx.uid)
      const role = await getRole(uid)
      const outcome = await updatePost(uid, role, input)
      if (outcome === 'not-found') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'postNotFound' })
      }
      if (outcome === 'forbidden') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'postUpdateForbidden',
        })
      }
      return { ok: true }
    }),
  delete: publicProcedure
    .input(postRefInputSchema)
    .mutation(async ({ ctx, input }) => {
      const uid = requireUid(ctx.uid)
      const role = await getRole(uid)
      const outcome = await deletePost(uid, role, input.postId)
      if (outcome === 'not-found') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'postNotFound' })
      }
      if (outcome === 'forbidden') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'postDeleteForbidden',
        })
      }
      return { ok: true }
    }),
})
