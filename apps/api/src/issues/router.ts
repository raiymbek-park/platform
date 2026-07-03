import {
  issueListInputSchema,
  reactionInputSchema,
} from '@raiymbek-park/shared/validation-schemas'
import { TRPCError } from '@trpc/server'

import { getRole } from '../resident/resident-store'
import { publicProcedure, router } from '../trpc'
import { listIssues, setReaction } from './issues-store'

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
})
