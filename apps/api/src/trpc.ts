import type { Context } from './context'

import { initTRPC } from '@trpc/server'

import { DEFAULT_LOCALE, translate } from './i18n'

const t = initTRPC.context<Context>().create({
  errorFormatter: ({ ctx, error, shape }) => ({
    ...shape,
    message: translate(ctx?.locale ?? DEFAULT_LOCALE, error.message),
  }),
})

export const router = t.router
export const publicProcedure = t.procedure
