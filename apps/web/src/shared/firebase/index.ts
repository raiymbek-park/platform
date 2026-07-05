import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

import { firebaseConfig } from './config'

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
auth.languageCode = navigator.language

export const storage = getStorage(app)

// E2E only: bypass reCAPTCHA so test phone numbers verify in a headless browser
// (real reCAPTCHA escalates to an image challenge under automation), and route
// Storage uploads to the local emulator instead of the live bucket.
if (import.meta.env.MODE === 'e2e') {
  auth.settings.appVerificationDisabledForTesting = true
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}
