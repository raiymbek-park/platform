import { getLastVisit, getRole } from '../resident/resident-store'
import { publicProcedure, router } from '../trpc'
import { getEvents } from './events-store'

export const eventsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.uid) return getEvents(null, null, null, ctx.locale)
    const [role, lastVisit] = await Promise.all([
      getRole(ctx.uid),
      getLastVisit(ctx.uid),
    ])
    return getEvents(ctx.uid, role, lastVisit, ctx.locale)
  }),
})
