import type { Auth } from 'firebase-admin/auth'
import type { Firestore } from 'firebase-admin/firestore'

import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'

import { ensureLocalDevCredentials } from './dev-credentials'

const ensureApp = (): void => {
  if (getApps().length > 0) return
  ensureLocalDevCredentials()
  initializeApp()
}

let db: Firestore | null = null

export const getDb = (): Firestore => {
  if (db) return db
  ensureApp()
  db = getFirestore()
  return db
}

export const getAuthAdmin = (): Auth => {
  ensureApp()
  return getAuth()
}

export type Identity = {
  phone: string | null
  uid: string
}

export const verifyIdToken = async (
  idToken: string,
): Promise<Identity | null> => {
  try {
    ensureApp()
    const decoded = await getAuth().verifyIdToken(idToken)
    return { phone: decoded.phone_number ?? null, uid: decoded.uid }
  } catch {
    return null
  }
}

export { FieldValue, Timestamp }
