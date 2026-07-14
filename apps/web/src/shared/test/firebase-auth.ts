import { vi } from 'vitest'

type FakeUser = {
  uid: string
  getIdToken: () => Promise<string>
}

const fakeUser: FakeUser = {
  uid: 'resident-uid',
  getIdToken: () => Promise.resolve('fake-id-token'),
}

const authState = {
  currentUser: null as FakeUser | null,
}

const scenario = {
  isSignInFailing: false,
  popupErrorCode: null as string | null,
}

const signInWithCustomToken = vi.fn((_auth: unknown, _token: string) => {
  if (scenario.isSignInFailing) {
    return Promise.reject({ code: 'auth/network-request-failed' })
  }
  authState.currentUser = fakeUser
  return Promise.resolve({ user: fakeUser })
})

const googleUser: FakeUser = {
  uid: 'google-uid',
  getIdToken: () => Promise.resolve('fake-google-id-token'),
}

class GoogleAuthProvider {}

const signInWithPopup = vi.fn((_auth: unknown, _provider: unknown) => {
  if (scenario.popupErrorCode) {
    return Promise.reject({ code: scenario.popupErrorCode })
  }
  authState.currentUser = googleUser
  return Promise.resolve({ user: googleUser })
})

const getAuth = () => ({
  get currentUser() {
    return authState.currentUser
  },
  languageCode: 'ru',
  authStateReady: () => Promise.resolve(),
})

const signOut = vi.fn(() => {
  authState.currentUser = null
  return Promise.resolve()
})

export const firebaseAuthModule = {
  GoogleAuthProvider,
  connectAuthEmulator: vi.fn(),
  getAuth,
  signInWithCustomToken,
  signInWithPopup,
  signOut,
}

export const firebaseAppModule = {
  initializeApp: () => ({ name: 'test-app' }),
}

export const firebaseAuth = {
  signIn: () => {
    authState.currentUser = fakeUser
  },
  signOut: () => {
    authState.currentUser = null
  },
  isSignedIn: () => authState.currentUser !== null,
  failCustomTokenSignIn: () => {
    scenario.isSignInFailing = true
  },
  failGooglePopup: (code: string) => {
    scenario.popupErrorCode = code
  },
  recoverGooglePopup: () => {
    scenario.popupErrorCode = null
  },
  googlePopupCount: () => signInWithPopup.mock.calls.length,
  reset: () => {
    authState.currentUser = null
    scenario.isSignInFailing = false
    scenario.popupErrorCode = null
    signInWithCustomToken.mockClear()
    signInWithPopup.mockClear()
    signOut.mockClear()
  },
}
