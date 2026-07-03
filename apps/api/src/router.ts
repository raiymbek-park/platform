import { eventsRouter } from './events/router'
import { issuesRouter } from './issues/router'
import { residentRouter } from './resident/router'
import { serviceContactsRouter } from './service-contacts/router'
import { publicProcedure, router } from './trpc'

export type { Context } from './context'
export type { Event } from './events/events-store'
export type { Issue, IssueAuthor } from './issues/issues-store'
export type { ResidentProfile } from './resident/router'
export type { ServiceContact } from './service-contacts/service-contacts-store'

export { createContext } from './context'

export const appRouter = router({
  events: eventsRouter,
  issues: issuesRouter,
  resident: residentRouter,
  serviceContacts: serviceContactsRouter,
  welcome: publicProcedure.query(() => ({
    message: 'Добро пожаловать в Raiymbek Park',
  })),
})

export type AppRouter = typeof appRouter
