import type { DocumentData, Transaction } from 'firebase-admin/firestore'

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

export type SendRules = {
  intervalMs: number
  sendsPerWindow: number
  windowMs: number
}

export type ReserveSendInput = {
  codeHash: string
  now: number
  phone: string
  rules: SendRules
  salt: string
  ttlMs: number
}

export type ReserveSendResult =
  | { isBlocked: true }
  | { isBlocked: false; previous: OtpRecord | null }

export type VerifyAttemptInput = {
  isMatch: (record: OtpRecord) => boolean
  maxAttempts: number
  now: number
  phone: string
}

export type VerifyOutcome = 'invalid' | 'ok'

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

const readOtp = async (
  transaction: Transaction,
  phone: string,
): Promise<OtpRecord | null> => {
  const snap = await transaction.get(docRef(phone))
  const data = snap.data()
  return data ? parseOtp(data) : null
}

export const reserveSend = ({
  codeHash,
  now,
  phone,
  rules,
  salt,
  ttlMs,
}: ReserveSendInput): Promise<ReserveSendResult> =>
  getDb().runTransaction<ReserveSendResult>(async transaction => {
    const previous = await readOtp(transaction, phone)
    if (previous && now - previous.lastSentAt < rules.intervalMs) {
      return { isBlocked: true }
    }
    const isWindowActive =
      previous !== null && now - previous.windowStart < rules.windowMs
    const sendCount = isWindowActive ? previous.sendCount : 0
    if (sendCount >= rules.sendsPerWindow) return { isBlocked: true }

    const record: OtpRecord = {
      attemptCount: 0,
      codeHash,
      createdAt: now,
      expiresAt: now + ttlMs,
      lastSentAt: now,
      salt,
      sendCount: sendCount + 1,
      windowStart: isWindowActive ? previous.windowStart : now,
    }
    transaction.set(docRef(phone), record)
    return { isBlocked: false, previous }
  })

export const verifyAttempt = ({
  isMatch,
  maxAttempts,
  now,
  phone,
}: VerifyAttemptInput): Promise<VerifyOutcome> =>
  getDb().runTransaction<VerifyOutcome>(async transaction => {
    const record = await readOtp(transaction, phone)
    if (!record || now > record.expiresAt) return 'invalid'
    if (record.attemptCount >= maxAttempts) {
      transaction.delete(docRef(phone))
      return 'invalid'
    }
    if (isMatch(record)) return 'ok'

    const attemptCount = record.attemptCount + 1
    if (attemptCount >= maxAttempts) transaction.delete(docRef(phone))
    else transaction.update(docRef(phone), { attemptCount })
    return 'invalid'
  })

export const upsertOtp = async (
  phone: string,
  record: OtpRecord,
): Promise<void> => {
  await docRef(phone).set(record)
}

export const deleteOtp = async (phone: string): Promise<void> => {
  await docRef(phone).delete()
}
