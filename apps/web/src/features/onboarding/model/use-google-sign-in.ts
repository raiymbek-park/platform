import { useMutation } from '@tanstack/react-query'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

import { auth } from '@/shared/firebase'

export const useGoogleSignIn = () =>
  useMutation({
    mutationFn: () => signInWithPopup(auth, new GoogleAuthProvider()),
  })
