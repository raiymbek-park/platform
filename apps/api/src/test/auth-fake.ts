declare global {
  var __authFake: { counter: number; users: Map<string, string> } | undefined
}

const state = globalThis.__authFake ?? {
  counter: 0,
  users: new Map<string, string>(),
}
globalThis.__authFake = state

export const authFake = {
  admin: {
    createCustomToken: (uid: string): Promise<string> =>
      Promise.resolve(`custom-token-${uid}`),
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
  },
  seedUser: (phoneNumber: string, uid: string): void => {
    state.users.set(phoneNumber, uid)
  },
  reset: (): void => {
    state.users.clear()
    state.counter = 0
  },
}
