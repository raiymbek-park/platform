import { authErrorCode } from './auth-error'

// A FirebaseError from signInWithCustomToken carries an `auth/*` code; tRPC
// errors don't, so this isolates the "code verified but session sign-in
// failed" case (error-states S7).
export const isSignInFailure = (error: unknown) =>
  authErrorCode(error)?.startsWith('auth/') ?? false
