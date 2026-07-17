import { useMutation } from '@tanstack/react-query'
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'

import { auth } from '@/shared/firebase'

type SocialProvider = 'google' | 'facebook'

const authProviders = {
  facebook: FacebookAuthProvider,
  google: GoogleAuthProvider,
}

export const useSocialSignIn = () =>
  useMutation({
    mutationFn: (provider: SocialProvider) =>
      signInWithPopup(auth, new authProviders[provider]()),
  })
