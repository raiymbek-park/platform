import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'

import { auth } from '@/shared/firebase'

import { useConfirmationStore } from './use-confirmation-store'

type SendVerification = {
  container: HTMLElement
  phone: string
}

export const sendVerification = async ({
  container,
  phone,
}: SendVerification) => {
  const verifier = new RecaptchaVerifier(auth, container, { size: 'invisible' })
  try {
    const confirmation = await signInWithPhoneNumber(auth, phone, verifier)
    useConfirmationStore.getState().setConfirmation(confirmation)
  } finally {
    verifier.clear()
  }
}
