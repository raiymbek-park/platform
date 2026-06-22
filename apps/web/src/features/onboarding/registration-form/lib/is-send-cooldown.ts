import { trpcErrorCode } from '@/shared/api'

// A send blocked by an active cooldown (TOO_MANY_REQUESTS) means a live code
// already exists for the number — the user should go enter it on the verify
// screen rather than see a failure.
export const isSendCooldown = (error: unknown) =>
  trpcErrorCode(error) === 'TOO_MANY_REQUESTS'
