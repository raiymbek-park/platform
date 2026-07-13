import { useMutation } from '@tanstack/react-query'
import { signInWithCustomToken } from 'firebase/auth'
import { useRef } from 'react'

import { trpcClient } from '@/shared/api'
import { auth } from '@/shared/firebase'

type VerifyOtpInput = {
  code: string
  phone: string
}

// A successful otp.verify deletes the server-side record, so a retry after a
// failed Firebase sign-in must reuse the already-minted token instead of
// re-verifying the (now consumed) code.
export const useVerifyOtp = () => {
  const mintedToken = useRef<string | null>(null)

  return useMutation({
    mutationFn: async (input: VerifyOtpInput) => {
      const token =
        mintedToken.current ?? (await trpcClient.otp.verify.mutate(input)).token
      mintedToken.current = token
      await signInWithCustomToken(auth, token)
      mintedToken.current = null
    },
  })
}
