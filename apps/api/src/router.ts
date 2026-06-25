import { eventsRouter } from './events/router'
import { residentRouter } from './resident/router'
import { serviceContactsRouter } from './service-contacts/router'
import { publicProcedure, router } from './trpc'

export type { Context } from './context'
export type { Event } from './events/events-store'
export type { ResidentProfile } from './resident/router'
export type { ServiceContact } from './service-contacts/service-contacts-store'

export { createContext } from './context'

export const appRouter = router({
  events: eventsRouter,
  resident: residentRouter,
  serviceContacts: serviceContactsRouter,
  welcome: publicProcedure.query(() => ({
    message: 'Добро пожаловать в Raiymbek Park',
  })),
})

export type AppRouter = typeof appRouter
