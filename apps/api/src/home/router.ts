import { publicProcedure, router } from '../trpc'
import { changes, contacts, profile, services } from './mock'

export const homeRouter = router({
  profile: publicProcedure.query(() => profile),
  changes: publicProcedure.query(() => changes),
  services: publicProcedure.query(() => services),
  contacts: publicProcedure.query(() => contacts),
})
