import type { PermissionRole } from '@raiymbek-park/shared/validation-schemas'
import type { DocumentData } from 'firebase-admin/firestore'

import { resolveRole } from '@raiymbek-park/shared/validation-schemas'

import { FieldValue, getDb, Timestamp } from '../firestore'

export type Resident = {
  apartment: number
  avatarUrl: string | null
  block: number
  cars: string[]
  isPhoneVisible: boolean
  name: string
  phone: string
  role: string
}

export type ResidentUpdate = Omit<Resident, 'phone'>

const docRef = (uid: string) => getDb().collection('residents').doc(uid)

export const updateResident = async (
  uid: string,
  input: ResidentUpdate,
): Promise<void> => {
  await docRef(uid).set(input, { merge: true })
}

export const markVisit = async (uid: string): Promise<void> => {
  await docRef(uid).set(
    { lastVisit: FieldValue.serverTimestamp() },
    { merge: true },
  )
}

const parseResident = (data: DocumentData): Resident => ({
  apartment: typeof data.apartment === 'number' ? data.apartment : 0,
  avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : null,
  block: typeof data.block === 'number' ? data.block : 0,
  cars: Array.isArray(data.cars)
    ? data.cars.filter((plate: unknown) => typeof plate === 'string')
    : [],
  isPhoneVisible:
    typeof data.isPhoneVisible === 'boolean' ? data.isPhoneVisible : false,
  name: typeof data.name === 'string' ? data.name : '',
  phone: typeof data.phone === 'string' ? data.phone : '',
  role: typeof data.role === 'string' ? data.role : '',
})

export const getResident = async (uid: string): Promise<Resident | null> => {
  const snap = await docRef(uid).get()
  const data = snap.data()
  return data ? parseResident(data) : null
}

export const createResidentIfAbsent = async (
  uid: string,
  input: Resident,
): Promise<Resident> => {
  const ref = docRef(uid)
  return getDb().runTransaction(async tx => {
    const snap = await tx.get(ref)
    const data = snap.data()
    if (data) return parseResident(data)
    tx.set(ref, input)
    return input
  })
}

export const getRole = async (uid: string): Promise<PermissionRole> =>
  resolveRole((await getResident(uid))?.role)

export type ResidentSnapshot = {
  apartment: number
  block: number
  name: string
  phone: string
}

export const residentSnapshot = (
  resident: Resident | null,
): ResidentSnapshot => {
  const source = resident ?? { apartment: 0, block: 0, name: '', phone: '' }
  return {
    apartment: source.apartment,
    block: source.block,
    name: source.name,
    phone: source.phone,
  }
}

const toTimestamp = (value: unknown): Timestamp | null =>
  value instanceof Timestamp ? value : null

export const getLastVisit = async (uid: string): Promise<Timestamp | null> => {
  const snap = await docRef(uid).get()
  return toTimestamp(snap.data()?.lastVisit)
}

export type NotificationTarget = {
  lastNotifiedAt: Timestamp | null
  lastVisit: Timestamp | null
  role: PermissionRole
}

export const getNotificationTarget = async (
  uid: string,
): Promise<NotificationTarget | null> => {
  const snap = await docRef(uid).get()
  const data = snap.data()
  if (!data) return null
  return {
    lastNotifiedAt: toTimestamp(data.lastNotifiedAt),
    lastVisit: toTimestamp(data.lastVisit),
    role: resolveRole(data.role),
  }
}

export const markNotified = async (
  uid: string,
  at: Timestamp,
): Promise<void> => {
  await docRef(uid).set({ lastNotifiedAt: at }, { merge: true })
}
