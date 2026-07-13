import { trpcErrorCode } from './trpc-error'

// otp.verify rejects an invalid or expired code as BAD_REQUEST; everything
// else (network, gateway, internal) falls through to the generic branch.
export const isWrongCode = (error: unknown) =>
  trpcErrorCode(error) === 'BAD_REQUEST'
