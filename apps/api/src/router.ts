import { authRouter, otpRouter, residentRouter } from './onboarding/router'
import { publicProcedure, router } from './trpc'

export const appRouter = router({
  auth: authRouter,
  otp: otpRouter,
  resident: residentRouter,
  welcome: publicProcedure.query(() => ({
    message: 'Добро пожаловать в Raiymbek Park',
  })),
})

export type AppRouter = typeof appRouter
