import type { Auth } from 'firebase-admin/auth'
import type { Firestore } from 'firebase-admin/firestore'

import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import {
  FieldValue as adminFieldValue,
  getFirestore,
  Timestamp,
} from 'firebase-admin/firestore'

import { ensureLocalDevCredentials } from './dev-credentials'

export const ensureApp = (): void => {
  if (getApps().length > 0) return
  ensureLocalDevCredentials()
  initializeApp()
}

export type FieldValueApi = {
  increment(by: number): unknown
  serverTimestamp(): unknown
}

let db: Firestore | null = null
let injectedDb: Firestore | null = null
let injectedAuth: Auth | null = null

export let FieldValue: FieldValueApi = adminFieldValue

export const injectFirestore = (
  parts: { db: Firestore; fieldValue: FieldValueApi } | null,
): void => {
  injectedDb = parts?.db ?? null
  FieldValue = parts?.fieldValue ?? adminFieldValue
}

export const injectAuth = (auth: Auth | null): void => {
  injectedAuth = auth
}

export const resetFirestore = (): void => {
  injectFirestore(null)
  injectAuth(null)
}

export const getDb = (): Firestore => {
  if (injectedDb) return injectedDb
  if (db) return db
  ensureApp()
  db = getFirestore()
  return db
}

export const getAuthAdmin = (): Auth => {
  if (injectedAuth) return injectedAuth
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

export { Timestamp }
