import { getLastVisit } from '../onboarding/resident-store'
import { publicProcedure, router } from '../trpc'
import { getEvents } from './events-store'

export const eventsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const lastVisit = ctx.uid ? await getLastVisit(ctx.uid) : null
    return getEvents(lastVisit)
  }),
})
