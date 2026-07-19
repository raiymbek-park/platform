import type { Auth } from 'firebase-admin/auth'

import { injectAuth, injectFirestore } from '../firestore'
import { authFake } from './auth-fake'
import { fakeFieldValue, getFirestore } from './firestore-fake'

export { resetFirestore, Timestamp } from '../firestore'
export { authFake } from './auth-fake'
export { fake } from './firestore-fake'

export const injectFake = (): void => {
  injectFirestore({ db: getFirestore(), fieldValue: fakeFieldValue })
  injectAuth(authFake.admin as unknown as Auth)
}
