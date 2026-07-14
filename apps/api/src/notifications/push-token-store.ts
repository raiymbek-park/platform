import type { Locale } from '../i18n'

import { FieldValue, getDb } from '../firestore'
import { resolveLocale } from '../i18n'
import { toText } from '../store-helpers'

export type PushToken = {
  locale: Locale
  token: string
}

const tokensCollection = (uid: string) =>
  getDb().collection('residents').doc(uid).collection('pushTokens')

const tokenRef = (uid: string, token: string) =>
  tokensCollection(uid).doc(token)

const staleTokenRefs = async (uid: string, token: string) => {
  const snap = await getDb()
    .collectionGroup('pushTokens')
    .where('token', '==', token)
    .get()
  return snap.docs
    .map(doc => doc.ref)
    .filter(ref => ref.parent.parent?.id !== uid)
}

export const registerPushToken = async (
  uid: string,
  token: string,
  locale: Locale,
): Promise<void> => {
  const stale = await staleTokenRefs(uid, token)
  await Promise.all(stale.map(ref => ref.delete()))
  await tokenRef(uid, token).set(
    { locale, token, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  )
}

export const unregisterPushToken = async (
  uid: string,
  token: string,
): Promise<void> => {
  await tokenRef(uid, token).delete()
}

export const getResidentTokens = async (uid: string): Promise<PushToken[]> => {
  const snap = await tokensCollection(uid).get()
  return snap.docs.map(doc => ({
    locale: resolveLocale(toText(doc.data().locale)),
    token: doc.id,
  }))
}

export const residentIdsWithTokens = async (): Promise<string[]> => {
  const snap = await getDb().collectionGroup('pushTokens').get()
  const uids = snap.docs.flatMap(doc => {
    const resident = doc.ref.parent.parent
    return resident ? [resident.id] : []
  })
  return [...new Set(uids)]
}
