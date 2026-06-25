import type { DocumentData } from 'firebase-admin/firestore'

import { FieldValue, getDb, Timestamp } from '../firestore'

export type Resident = {
  apartment: number
  block: number
  name: string
  phone: string
  role: string
}

const docRef = (uid: string) => getDb().collection('residents').doc(uid)

export const createResident = async (
  uid: string,
  input: Resident,
): Promise<void> => {
  await docRef(uid).set(input)
}

export const markVisit = async (uid: string): Promise<void> => {
  await docRef(uid).set(
    { lastVisit: FieldValue.serverTimestamp() },
    { merge: true },
  )
}

const parseResident = (data: DocumentData): Resident => ({
  apartment: typeof data.apartment === 'number' ? data.apartment : 0,
  block: typeof data.block === 'number' ? data.block : 0,
  name: typeof data.name === 'string' ? data.name : '',
  phone: typeof data.phone === 'string' ? data.phone : '',
  role: typeof data.role === 'string' ? data.role : '',
})

export const getResident = async (uid: string): Promise<Resident | null> => {
  const snap = await docRef(uid).get()
  const data = snap.data()
  return data ? parseResident(data) : null
}

export const getLastVisit = async (uid: string): Promise<Timestamp | null> => {
  const snap = await docRef(uid).get()
  const value = snap.data()?.lastVisit
  return value instanceof Timestamp ? value : null
}
