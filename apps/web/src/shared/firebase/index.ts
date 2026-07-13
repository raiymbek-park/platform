import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

import { firebaseConfig } from './config'

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
auth.languageCode = navigator.language

export const storage = getStorage(app)

const authEmulator = import.meta.env.VITE_AUTH_EMULATOR
if (authEmulator) {
  connectAuthEmulator(auth, `http://${authEmulator}`, { disableWarnings: true })
}

if (import.meta.env.MODE === 'e2e') {
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}
