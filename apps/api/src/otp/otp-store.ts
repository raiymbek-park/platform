import type { DocumentData } from 'firebase-admin/firestore'

import { getDb } from '../firestore'

export type OtpRecord = {
  attemptCount: number
  codeHash: string
  createdAt: number
  expiresAt: number
  lastSentAt: number
  salt: string
  sendCount: number
  windowStart: number
}

const docRef = (phone: string) => getDb().collection('otps').doc(phone)

const parseOtp = (data: DocumentData): OtpRecord => ({
  attemptCount: typeof data.attemptCount === 'number' ? data.attemptCount : 0,
  codeHash: typeof data.codeHash === 'string' ? data.codeHash : '',
  createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
  expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : 0,
  lastSentAt: typeof data.lastSentAt === 'number' ? data.lastSentAt : 0,
  salt: typeof data.salt === 'string' ? data.salt : '',
  sendCount: typeof data.sendCount === 'number' ? data.sendCount : 0,
  windowStart: typeof data.windowStart === 'number' ? data.windowStart : 0,
})

export const getOtp = async (phone: string): Promise<OtpRecord | null> => {
  const snap = await docRef(phone).get()
  const data = snap.data()
  return data ? parseOtp(data) : null
}

export const upsertOtp = async (
  phone: string,
  record: OtpRecord,
): Promise<void> => {
  await docRef(phone).set(record)
}

export const saveAttemptCount = async (
  phone: string,
  attemptCount: number,
): Promise<void> => {
  await docRef(phone).set({ attemptCount }, { merge: true })
}

export const deleteOtp = async (phone: string): Promise<void> => {
  await docRef(phone).delete()
}
