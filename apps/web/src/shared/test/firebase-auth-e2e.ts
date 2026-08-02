type FirebaseUser = {
  displayName: string | null
  getIdToken: () => Promise<string>
  uid: string
}

const TOKEN_KEY = 'e2e-auth-token'
const TOKEN_PREFIX = 'custom-token-'

const toUser = (token: string): FirebaseUser => ({
  displayName: null,
  getIdToken: () => Promise.resolve(token),
  uid: token.replace(TOKEN_PREFIX, ''),
})

const storedToken = localStorage.getItem(TOKEN_KEY)

const auth = {
  currentUser: storedToken ? toUser(storedToken) : null,
  languageCode: 'ru',
  authStateReady: () => Promise.resolve(),
}

export const getAuth = () => auth

export const connectAuthEmulator = () => {}

export const signInWithCustomToken = (_auth: unknown, token: string) => {
  localStorage.setItem(TOKEN_KEY, token)
  auth.currentUser = toUser(token)
  return Promise.resolve({ user: auth.currentUser })
}

export const signOut = () => {
  localStorage.removeItem(TOKEN_KEY)
  auth.currentUser = null
  return Promise.resolve()
}

export class GoogleAuthProvider {}

export class FacebookAuthProvider {}

export const signInWithPopup = () =>
  Promise.reject(new Error('social sign-in is not part of the e2e stack'))
