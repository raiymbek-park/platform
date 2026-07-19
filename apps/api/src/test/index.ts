import type { Auth } from 'firebase-admin/auth'

import { injectAuth, injectFirestore } from '../firestore'
import { authFake } from './auth-fake'
import { FieldValue, getFirestore } from './firestore-fake'

export { resetFirestore } from '../firestore'
export { authFake } from './auth-fake'
export { FieldValue, fake, Timestamp } from './firestore-fake'

export const injectFake = (): void => {
  injectFirestore({ db: getFirestore(), fieldValue: FieldValue })
  injectAuth(authFake.admin as unknown as Auth)
}
