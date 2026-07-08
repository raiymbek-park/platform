import { authErrorCode } from './auth-error'

// Firebase Phone Auth rejects with a FirebaseError carrying a `.code`. When the
// number of SMS requests or code attempts is exceeded, that code is
// `auth/too-many-requests` — the signal to send the resident to the locked screen.
export const isTooManyRequests = (error: unknown) =>
  authErrorCode(error) === 'auth/too-many-requests'
