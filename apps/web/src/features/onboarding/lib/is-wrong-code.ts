const wrongCodes = ['auth/invalid-verification-code', 'auth/code-expired']

// Firebase's confirmationResult.confirm rejects with a FirebaseError carrying a
// `.code`. An invalid or expired SMS code is the "wrong code" case; everything
// else (network, internal) falls through to the generic error branch.
export const isWrongCode = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  typeof error.code === 'string' &&
  wrongCodes.includes(error.code)
