import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'
import { registerPushToken, unregisterPushToken } from './push-token-store'

const tokenInput = z.object({ token: z.string().min(1) })

export const notificationsRouter = router({
  registerToken: publicProcedure
    .input(tokenInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.uid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'phoneNotVerified',
        })
      }

      await registerPushToken(ctx.uid, input.token, ctx.locale)
      return { ok: true }
    }),
  unregisterToken: publicProcedure
    .input(tokenInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.uid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'phoneNotVerified',
        })
      }

      await unregisterPushToken(ctx.uid, input.token)
      return { ok: true }
    }),
})
