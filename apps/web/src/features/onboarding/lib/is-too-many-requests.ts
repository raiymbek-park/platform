import { trpcErrorCode } from './trpc-error'

export const isTooManyRequests = (error: unknown) =>
  trpcErrorCode(error) === 'TOO_MANY_REQUESTS'
