import { isTRPCClientError } from '@trpc/client'

export const isNotFoundError = (error: unknown): boolean =>
  isTRPCClientError(error) && error.data?.code === 'NOT_FOUND'
