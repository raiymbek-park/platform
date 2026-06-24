import { vi } from 'vitest'

export const NOW = 1_700_000_000_000

type FakeUser = { uid: string; getIdToken: () => Promise<string> }

export const makeFakeAuth = (user: FakeUser | null = null) => {
  const auth = {
    currentUser: user,
    authStateReady: vi.fn(() => Promise.resolve()),
    useDeviceLanguage: vi.fn(),
  }
  return auth
}

export const fakeUser = (uid = 'uid-1'): FakeUser => ({
  uid,
  getIdToken: vi.fn(() => Promise.resolve('id-token')),
})
