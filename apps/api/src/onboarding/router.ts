import { TRPCError } from '@trpc/server'

import { publicProcedure, router } from '../trpc'
import { registerInputSchema } from './contract'
import { createResident, markVisit } from './resident-store'

export const residentRouter = router({
  register: publicProcedure
    .input(registerInputSchema)
    .mutation(async ({ ctx, input: resident }) => {
      if (!ctx.uid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Phone is not verified',
        })
      }

      const stored = { ...resident, phone: ctx.phone ?? resident.phone }
      await createResident(ctx.uid, stored)
      return { resident: stored }
    }),
  markVisit: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.uid) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Phone is not verified',
      })
    }

    await markVisit(ctx.uid)
    return { ok: true }
  }),
})
