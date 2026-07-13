import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

import { firebaseConfig } from './config'

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
auth.languageCode = navigator.language

export const storage = getStorage(app)

// E2E only: route Storage uploads to the local emulator instead of the live
// bucket. OTP delivery is bypassed server-side (OTP_TEST_MODE test-code map),
// so no client-side auth switch is needed here.
if (import.meta.env.MODE === 'e2e') {
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}
