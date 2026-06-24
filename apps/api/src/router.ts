import { homeRouter } from './home/router'
import { residentRouter } from './onboarding/router'
import { publicProcedure, router } from './trpc'

export type { Context } from './context'

export { createContext } from './context'

export const appRouter = router({
  home: homeRouter,
  resident: residentRouter,
  welcome: publicProcedure.query(() => ({
    message: 'Добро пожаловать в Raiymbek Park',
  })),
})

export type AppRouter = typeof appRouter
