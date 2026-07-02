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
    .query(({ ctx, input }) => listIssues(input.status, ctx.uid)),
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

      await setReaction(input.issueId, ctx.uid, input.kind)
      return { ok: true }
    }),
})
