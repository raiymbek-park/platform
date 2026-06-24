import { redirect } from '@tanstack/react-router'
import { signOut as firebaseSignOut } from 'firebase/auth'

import { auth } from '@/shared/firebase'

export const isSignedIn = async () => {
  await auth.authStateReady()
  return auth.currentUser !== null
}

export const ensureResidentSession = async () => {
  if (await isSignedIn()) return
  throw redirect({ to: '/onboarding/welcome' })
}

export const signOut = () => firebaseSignOut(auth)
