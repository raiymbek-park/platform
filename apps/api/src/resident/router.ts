import type { PermissionRole } from '@raiymbek-park/shared/validation-schemas'

import {
  DEFAULT_PERMISSION_ROLE,
  registerInputSchema,
  resolveRole,
} from '@raiymbek-park/shared/validation-schemas'
import { TRPCError } from '@trpc/server'

import { publicProcedure, router } from '../trpc'
import { createResident, getResident, markVisit } from './resident-store'

export type ResidentProfile = {
  apartment: number
  block: number
  id: string | null
  name: string
  role: PermissionRole
}

const emptyProfile: ResidentProfile = {
  apartment: 0,
  block: 0,
  id: null,
  name: '',
  role: DEFAULT_PERMISSION_ROLE,
}

export const residentRouter = router({
  register: publicProcedure
    .input(registerInputSchema)
    .mutation(async ({ ctx, input: resident }) => {
      if (!ctx.uid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'phoneNotVerified',
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
        message: 'phoneNotVerified',
      })
    }

    await markVisit(ctx.uid)
    return { ok: true }
  }),
  me: publicProcedure.query(async ({ ctx }): Promise<ResidentProfile> => {
    if (!ctx.uid) return emptyProfile
    const resident = await getResident(ctx.uid)
    if (!resident) return { ...emptyProfile, id: ctx.uid }
    return {
      apartment: resident.apartment,
      block: resident.block,
      id: ctx.uid,
      name: resident.name,
      role: resolveRole(resident.role),
    }
  }),
})
