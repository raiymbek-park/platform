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
}

const signInWithCustomToken = vi.fn((_auth: unknown, _token: string) => {
  if (scenario.isSignInFailing) {
    return Promise.reject({ code: 'auth/network-request-failed' })
  }
  authState.currentUser = fakeUser
  return Promise.resolve({ user: fakeUser })
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
  connectAuthEmulator: vi.fn(),
  getAuth,
  signInWithCustomToken,
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
  reset: () => {
    authState.currentUser = null
    scenario.isSignInFailing = false
    signInWithCustomToken.mockClear()
    signOut.mockClear()
  },
}
