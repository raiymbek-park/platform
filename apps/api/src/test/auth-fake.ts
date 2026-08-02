declare global {
  var __authFake: { counter: number; users: Map<string, string> } | undefined
}

const state = globalThis.__authFake ?? {
  counter: 0,
  users: new Map<string, string>(),
}
globalThis.__authFake = state

const TOKEN_PREFIX = 'custom-token-'

const phoneOf = (uid: string): string | null =>
  [...state.users.entries()].find(([, id]) => id === uid)?.[0] ?? null

export const authFake = {
  admin: {
    createCustomToken: (uid: string): Promise<string> =>
      Promise.resolve(`${TOKEN_PREFIX}${uid}`),
    createUser: ({
      phoneNumber,
    }: {
      phoneNumber: string
    }): Promise<{ uid: string }> => {
      if (state.users.has(phoneNumber))
        return Promise.reject(new Error('auth/phone-number-already-exists'))
      const uid = `auth-uid-${++state.counter}`
      state.users.set(phoneNumber, uid)
      return Promise.resolve({ uid })
    },
    getUserByPhoneNumber: (phoneNumber: string): Promise<{ uid: string }> => {
      const uid = state.users.get(phoneNumber)
      if (uid === undefined)
        return Promise.reject(new Error('auth/user-not-found'))
      return Promise.resolve({ uid })
    },
    verifyIdToken: (
      idToken: string,
    ): Promise<{ phone_number: string | null; uid: string }> => {
      if (!idToken.startsWith(TOKEN_PREFIX))
        return Promise.reject(new Error('auth/argument-error'))
      const uid = idToken.slice(TOKEN_PREFIX.length)
      return Promise.resolve({ phone_number: phoneOf(uid), uid })
    },
  },
  seedUser: (phoneNumber: string, uid: string): void => {
    state.users.set(phoneNumber, uid)
  },
  reset: (): void => {
    state.users.clear()
    state.counter = 0
  },
}
