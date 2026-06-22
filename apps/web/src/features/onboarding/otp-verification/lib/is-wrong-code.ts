import { trpcErrorCode } from '@/shared/api'

// A wrong or already-used code surfaces as a tRPC BAD_REQUEST. Other server
// codes (e.g. FORBIDDEN when the number is locked) are not "wrong code" — they
// fall through to the network/unknown branch.
export const isWrongCode = (error: unknown) =>
  trpcErrorCode(error) === 'BAD_REQUEST'
