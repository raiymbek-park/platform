import { vi } from 'vitest'

type FakeUser = {
  uid: string
  displayName: string | null
  getIdToken: () => Promise<string>
}

const fakeUser: FakeUser = {
  uid: 'resident-uid',
  displayName: null,
  getIdToken: () => Promise.resolve('fake-id-token'),
}

const authState = {
  currentUser: null as FakeUser | null,
}

const scenario = {
  isSignInFailing: false,
  popupErrorCode: null as string | null,
  popupDisplayName: 'Провайдер Имя' as string | null,
}

const signInWithCustomToken = vi.fn((_auth: unknown, _token: string) => {
  if (scenario.isSignInFailing) {
    return Promise.reject({ code: 'auth/network-request-failed' })
  }
  authState.currentUser = fakeUser
  return Promise.resolve({ user: fakeUser })
})

class GoogleAuthProvider {}
class FacebookAuthProvider {}

const socialUser = (): FakeUser => ({
  uid: 'social-uid',
  displayName: scenario.popupDisplayName,
  getIdToken: () => Promise.resolve('fake-social-id-token'),
})

const signInWithPopup = vi.fn((_auth: unknown, _provider: unknown) => {
  if (scenario.popupErrorCode) {
    return Promise.reject({ code: scenario.popupErrorCode })
  }
  authState.currentUser = socialUser()
  return Promise.resolve({ user: authState.currentUser })
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
  FacebookAuthProvider,
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

const popupProviderName = (provider: unknown) => {
  if (provider instanceof GoogleAuthProvider) return 'google'
  if (provider instanceof FacebookAuthProvider) return 'facebook'
  return 'unknown'
}

export const firebaseAuth = {
  signIn: () => {
    authState.currentUser = fakeUser
  },
  signInSocial: (displayName: string | null = 'Провайдер Имя') => {
    authState.currentUser = { ...socialUser(), displayName }
  },
  signOut: () => {
    authState.currentUser = null
  },
  isSignedIn: () => authState.currentUser !== null,
  failCustomTokenSignIn: () => {
    scenario.isSignInFailing = true
  },
  failPopup: (code: string) => {
    scenario.popupErrorCode = code
  },
  recoverPopup: () => {
    scenario.popupErrorCode = null
  },
  setPopupDisplayName: (displayName: string | null) => {
    scenario.popupDisplayName = displayName
  },
  popupCount: () => signInWithPopup.mock.calls.length,
  popupProviders: () =>
    signInWithPopup.mock.calls.map(([, provider]) =>
      popupProviderName(provider),
    ),
  reset: () => {
    authState.currentUser = null
    scenario.isSignInFailing = false
    scenario.popupErrorCode = null
    scenario.popupDisplayName = 'Провайдер Имя'
    signInWithCustomToken.mockClear()
    signInWithPopup.mockClear()
    signOut.mockClear()
  },
}
