import type { PermissionRole } from '@raiymbek-park/shared/validation-schemas'

import {
  DEFAULT_PERMISSION_ROLE,
  profileUpdateSchema,
  registerInputSchema,
  resolveRole,
  roles,
} from '@raiymbek-park/shared/validation-schemas'
import { TRPCError } from '@trpc/server'

import { publicProcedure, router } from '../trpc'
import {
  createResident,
  getResident,
  markVisit,
  updateResident,
} from './resident-store'

export type ResidentProfile = {
  apartment: number
  avatarUrl: string | null
  block: number
  cars: string[]
  id: string | null
  isPhoneVisible: boolean
  name: string
  phone: string
  role: PermissionRole
}

const emptyProfile: ResidentProfile = {
  apartment: 0,
  avatarUrl: null,
  block: 0,
  cars: [],
  id: null,
  isPhoneVisible: false,
  name: '',
  phone: '',
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

      const stored = {
        ...resident,
        avatarUrl: null,
        cars: [],
        isPhoneVisible: false,
        phone: ctx.phone ?? resident.phone,
      }
      await createResident(ctx.uid, stored)
      return { resident: stored }
    }),
  update: publicProcedure
    .input(profileUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.uid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'phoneNotVerified',
        })
      }

      const current = await getResident(ctx.uid)
      const hasResidencyRole =
        !current || roles.some(role => role === current.role)
      await updateResident(ctx.uid, {
        ...input,
        role: hasResidencyRole ? input.role : current.role,
      })
      return { ok: true }
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
      avatarUrl: resident.avatarUrl,
      block: resident.block,
      cars: resident.cars,
      id: ctx.uid,
      isPhoneVisible: resident.isPhoneVisible,
      name: resident.name,
      phone: resident.phone,
      role: resolveRole(resident.role),
    }
  }),
})
