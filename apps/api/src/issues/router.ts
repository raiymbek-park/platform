import {
  issueCreatePayloadSchema,
  issueDeleteInputSchema,
  issueGetInputSchema,
  issueListInputSchema,
  issueUpdateInputSchema,
  reactionInputSchema,
  statusChangeInputSchema,
} from '@raiymbek-park/shared/validation-schemas'
import { TRPCError } from '@trpc/server'

import { getRole } from '../resident/resident-store'
import { publicProcedure, router } from '../trpc'
import {
  changeStatus,
  createIssue,
  deleteIssue,
  getIssue,
  listIssues,
  setReaction,
  updateIssue,
} from './issues-store'

export const issuesRouter = router({
  list: publicProcedure
    .input(issueListInputSchema)
    .query(async ({ ctx, input }) => {
      const role = ctx.uid ? await getRole(ctx.uid) : null
      return listIssues({
        cursor: input.cursor,
        role,
        search: input.search,
        status: input.status,
        uid: ctx.uid,
      })
    }),
  react: publicProcedure
    .input(reactionInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.uid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'phoneNotVerified',
        })
      }

      const role = await getRole(ctx.uid)
      if (role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'reactionForbidden' })
      }

      const updated = await setReaction(input.issueId, ctx.uid, input.kind)
      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'issueNotFound' })
      }
      return { ok: true }
    }),
  get: publicProcedure
    .input(issueGetInputSchema)
    .query(async ({ ctx, input }) => {
      const role = ctx.uid ? await getRole(ctx.uid) : null
      const issue = await getIssue(ctx.uid, role, input.issueId)
      if (!issue) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'issueNotFound' })
      }
      return issue
    }),
  create: publicProcedure
    .input(issueCreatePayloadSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.uid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'phoneNotVerified',
        })
      }

      const role = await getRole(ctx.uid)
      if (role === 'viewer' || role === 'manager') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'issueCreateForbidden',
        })
      }

      return createIssue(ctx.uid, input)
    }),
  update: publicProcedure
    .input(issueUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.uid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'phoneNotVerified',
        })
      }

      const role = await getRole(ctx.uid)
      const outcome = await updateIssue(ctx.uid, role, input)
      if (outcome === 'not-found') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'issueNotFound' })
      }
      if (outcome === 'forbidden') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'issueUpdateForbidden',
        })
      }
      return { ok: true }
    }),
  changeStatus: publicProcedure
    .input(statusChangeInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.uid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'phoneNotVerified',
        })
      }

      const role = await getRole(ctx.uid)
      if (role !== 'manager' && role !== 'administration') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'statusChangeForbidden',
        })
      }

      const ok = await changeStatus(ctx.uid, input)
      if (!ok) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'issueNotFound' })
      }
      return { ok: true }
    }),
  delete: publicProcedure
    .input(issueDeleteInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.uid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'phoneNotVerified',
        })
      }

      const role = await getRole(ctx.uid)
      const outcome = await deleteIssue(ctx.uid, role, input.issueId)
      if (outcome === 'not-found') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'issueNotFound' })
      }
      if (outcome === 'forbidden') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'issueDeleteForbidden',
        })
      }
      return { ok: true }
    }),
})
