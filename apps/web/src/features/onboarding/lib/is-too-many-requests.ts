import { authErrorCode } from './auth-error'

// Firebase throttles repeated SMS/verification attempts on real numbers and
// surfaces it two ways: the documented `auth/too-many-requests`, and an
// internal `auth/error-code:-39` (HTTP 503) the backend returns for the same
// too-many-attempts abuse limit. Both are the signal to send the resident to
// the locked screen — routing -39 to a generic "try again" toast only invites
// more attempts, which deepens the throttle.
const tooManyRequestCodes = ['auth/too-many-requests', 'auth/error-code:-39']

export const isTooManyRequests = (error: unknown) => {
  const code = authErrorCode(error)
  return code !== undefined && tooManyRequestCodes.includes(code)
}
