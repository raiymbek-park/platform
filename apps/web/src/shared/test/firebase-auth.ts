import { vi } from 'vitest'

type FakeUser = {
  uid: string
  getIdToken: () => Promise<string>
}

type ConfirmOutcome =
  | { kind: 'success' }
  | { kind: 'wrong-code' }
  | { kind: 'network' }
  | { kind: 'too-many-requests' }

type SendOutcome =
  | { kind: 'success' }
  | { kind: 'failure' }
  | { kind: 'too-many-requests' }

const fakeUser: FakeUser = {
  uid: 'resident-uid',
  getIdToken: () => Promise.resolve('fake-id-token'),
}

const authState = {
  currentUser: null as FakeUser | null,
}

const scenario = {
  send: { kind: 'success' } as SendOutcome,
  confirm: { kind: 'success' } as ConfirmOutcome,
  hold: null as { onStart: () => void; release: Promise<void> } | null,
}

const confirmError = {
  'wrong-code': { code: 'auth/invalid-verification-code' },
  network: { code: 'auth/network-request-failed' },
  'too-many-requests': { code: 'auth/too-many-requests' },
}

const confirm = (_code: string) => {
  const { confirm: outcome } = scenario
  if (outcome.kind === 'success') {
    authState.currentUser = fakeUser
    return Promise.resolve({ user: fakeUser })
  }
  return Promise.reject(confirmError[outcome.kind])
}

const sendError = {
  failure: { code: 'auth/network-request-failed' },
  'too-many-requests': { code: 'auth/too-many-requests' },
}

const signInWithPhoneNumber = vi.fn(async () => {
  if (scenario.hold) {
    scenario.hold.onStart()
    await scenario.hold.release
  }
  if (scenario.send.kind !== 'success') {
    return Promise.reject(sendError[scenario.send.kind])
  }
  return { confirm }
})

class RecaptchaVerifier {
  verify = () => Promise.resolve('recaptcha-token')
  render = () => Promise.resolve(0)
  clear = vi.fn()
}

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
  RecaptchaVerifier,
  getAuth,
  signInWithPhoneNumber,
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
  failSend: () => {
    scenario.send = { kind: 'failure' }
  },
  failSendTooManyRequests: () => {
    scenario.send = { kind: 'too-many-requests' }
  },
  holdSend: (onStart: () => void, release: Promise<void>) => {
    scenario.hold = { onStart, release }
  },
  rejectCodeAsWrong: () => {
    scenario.confirm = { kind: 'wrong-code' }
  },
  rejectCodeWithNetworkError: () => {
    scenario.confirm = { kind: 'network' }
  },
  rejectCodeTooManyRequests: () => {
    scenario.confirm = { kind: 'too-many-requests' }
  },
  reset: () => {
    authState.currentUser = null
    scenario.send = { kind: 'success' }
    scenario.confirm = { kind: 'success' }
    scenario.hold = null
    signInWithPhoneNumber.mockClear()
    signOut.mockClear()
  },
}
