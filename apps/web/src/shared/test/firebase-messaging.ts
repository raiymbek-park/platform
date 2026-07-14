import { vi } from 'vitest'

const state = {
  isPushSupported: false,
  isTokenFailing: false,
  token: 'push-token-1',
}

const isSupported = vi.fn(() => Promise.resolve(state.isPushSupported))

const getMessaging = vi.fn(() => ({ name: 'test-messaging' }))

const getToken = vi.fn(() =>
  state.isTokenFailing
    ? Promise.reject(new Error('token unavailable'))
    : Promise.resolve(state.token),
)

export const firebaseMessagingModule = { getMessaging, getToken, isSupported }

export const firebaseMessaging = {
  supportPush: () => {
    state.isPushSupported = true
  },
  failToken: () => {
    state.isTokenFailing = true
  },
  setToken: (token: string) => {
    state.token = token
  },
  isSupportedCallCount: () => isSupported.mock.calls.length,
  tokenRequestCount: () => getToken.mock.calls.length,
  reset: () => {
    state.isPushSupported = false
    state.isTokenFailing = false
    state.token = 'push-token-1'
    getMessaging.mockClear()
    getToken.mockClear()
    isSupported.mockClear()
  },
}
