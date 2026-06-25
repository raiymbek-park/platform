import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone'

import { verifyIdToken } from './firestore'

export type Context = {
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
  const token = bearerToken(req.headers.authorization)
  if (!token) return { phone: null, uid: null }
  const identity = await verifyIdToken(token)
  return identity ?? { phone: null, uid: null }
}
