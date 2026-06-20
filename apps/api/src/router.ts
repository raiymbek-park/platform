import { publicProcedure, router } from './trpc'

export const appRouter = router({
  welcome: publicProcedure.query(() => ({
    message: 'Добро пожаловать в Raiymbek Park',
  })),
})

export type AppRouter = typeof appRouter
