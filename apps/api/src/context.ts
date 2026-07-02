import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone'
import type { Locale } from './i18n'

import { verifyIdToken } from './firestore'
import { resolveLocale } from './i18n'

export type Context = {
  locale: Locale
  phone: string | null
  uid: string | null
}

const bearerToken = (header: string | undefined): string | null => {
  if (!header) return null
  const [scheme, token] = header.split(' ')
  return scheme === 'Bearer' && token ? token : null
}

export const createContext = async ({
  req,
}: CreateHTTPContextOptions): Promise<Context> => {
  const locale = resolveLocale(req.headers['x-locale'])
  const token = bearerToken(req.headers.authorization)
  if (!token) return { locale, phone: null, uid: null }
  const identity = await verifyIdToken(token)
  return { locale, ...(identity ?? { phone: null, uid: null }) }
}
