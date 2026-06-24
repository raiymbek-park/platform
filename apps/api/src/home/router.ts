import type { ResidentProfile } from './content'

import { getLastVisit, getResident } from '../onboarding/resident-store'
import { publicProcedure, router } from '../trpc'
import { getChanges, getContacts } from './content'

const emptyProfile: ResidentProfile = { apartment: 0, block: 0, name: '' }

export const homeRouter = router({
  profile: publicProcedure.query(async ({ ctx }): Promise<ResidentProfile> => {
    if (!ctx.uid) return emptyProfile
    const resident = await getResident(ctx.uid)
    if (!resident) return emptyProfile
    return {
      apartment: resident.apartment,
      block: resident.block,
      name: resident.name,
    }
  }),
  changes: publicProcedure.query(async ({ ctx }) => {
    const lastVisit = ctx.uid ? await getLastVisit(ctx.uid) : null
    return getChanges(lastVisit)
  }),
  contacts: publicProcedure.query(() => getContacts()),
})
