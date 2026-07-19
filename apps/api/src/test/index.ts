import { injectFirestore } from '../firestore'
import { FieldValue, getFirestore } from './firestore-fake'

export { resetFirestore } from '../firestore'
export { FieldValue, fake, Timestamp } from './firestore-fake'

export const injectFake = (): void =>
  injectFirestore({ db: getFirestore(), fieldValue: FieldValue })
