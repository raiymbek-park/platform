import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

import { firebaseConfig } from './config'

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
auth.languageCode = navigator.language

// E2E only: bypass reCAPTCHA so test phone numbers verify in a headless browser
// (real reCAPTCHA escalates to an image challenge under automation).
if (import.meta.env.MODE === 'e2e') {
  auth.settings.appVerificationDisabledForTesting = true
}
