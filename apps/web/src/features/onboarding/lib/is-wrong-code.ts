import { authErrorCode } from './auth-error'

const wrongCodes = ['auth/invalid-verification-code', 'auth/code-expired']

// Firebase's confirmationResult.confirm rejects with a FirebaseError carrying a
// `.code`. An invalid or expired SMS code is the "wrong code" case; everything
// else (network, internal) falls through to the generic error branch.
export const isWrongCode = (error: unknown) => {
  const code = authErrorCode(error)
  return code !== undefined && wrongCodes.includes(code)
}
