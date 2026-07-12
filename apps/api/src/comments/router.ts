import {
  commentCreateInputSchema,
  commentDeleteInputSchema,
  commentListInputSchema,
  commentUpdateInputSchema,
} from '@raiymbek-park/shared/validation-schemas'
import { TRPCError } from '@trpc/server'

import { getRole } from '../resident/resident-store'
import { publicProcedure, router } from '../trpc'
import {
  createComment,
  deleteComment,
  listComments,
  updateComment,
} from './comments-store'

const requireUid = (uid: string | null): string => {
  if (!uid) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'phoneNotVerified' })
  }
  return uid
}

const raise = (outcome: 'not-found' | 'forbidden', action: string): never => {
  if (outcome === 'not-found') {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'commentNotFound' })
  }
  throw new TRPCError({ code: 'FORBIDDEN', message: action })
}

export const commentsRouter = router({
  list: publicProcedure.input(commentListInputSchema).query(({ ctx, input }) =>
    listComments({
      cursor: input.cursor,
      locale: ctx.locale,
      parent: input.parent,
      parentId: input.parentId,
      uid: ctx.uid,
    }),
  ),
  create: publicProcedure
    .input(commentCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const uid = requireUid(ctx.uid)
      const role = await getRole(uid)
      if (role === 'viewer') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'commentCreateForbidden',
        })
      }
      const outcome = await createComment(uid, ctx.locale, input)
      if (outcome !== 'ok') raise(outcome, 'commentCreateForbidden')
      return { ok: true }
    }),
  update: publicProcedure
    .input(commentUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const uid = requireUid(ctx.uid)
      const role = await getRole(uid)
      const outcome = await updateComment(uid, role, input)
      if (outcome !== 'ok') raise(outcome, 'commentUpdateForbidden')
      return { ok: true }
    }),
  delete: publicProcedure
    .input(commentDeleteInputSchema)
    .mutation(async ({ ctx, input }) => {
      const uid = requireUid(ctx.uid)
      const role = await getRole(uid)
      const outcome = await deleteComment(uid, role, input)
      if (outcome !== 'ok') raise(outcome, 'commentDeleteForbidden')
      return { ok: true }
    }),
})
