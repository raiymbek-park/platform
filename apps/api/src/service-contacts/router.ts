import { publicProcedure, router } from '../trpc'
import { getServiceContacts } from './service-contacts-store'

export const serviceContactsRouter = router({
  list: publicProcedure.query(() => getServiceContacts()),
})
