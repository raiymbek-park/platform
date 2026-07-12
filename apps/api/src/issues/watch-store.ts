import type { Transaction } from 'firebase-admin/firestore'

import { FieldValue, getDb } from '../firestore'

const watchesCollection = (uid: string) =>
  getDb().collection('residents').doc(uid).collection('watches')

const watchRef = (uid: string, issueId: string) =>
  watchesCollection(uid).doc(issueId)

export const toggleWatch = (uid: string, issueId: string): Promise<boolean> =>
  getDb().runTransaction(async transaction => {
    const issue = await transaction.get(
      getDb().collection('issues').doc(issueId),
    )
    if (!issue.exists) return false
    const ref = watchRef(uid, issueId)
    const watch = await transaction.get(ref)
    if (watch.exists) transaction.delete(ref)
    else transaction.create(ref, { createdAt: FieldValue.serverTimestamp() })
    return true
  })

export const addWatch = (
  transaction: Transaction,
  uid: string,
  issueId: string,
): void => {
  transaction.set(
    watchRef(uid, issueId),
    { createdAt: FieldValue.serverTimestamp() },
    { merge: true },
  )
}

export const getWatchedIssueIds = async (uid: string): Promise<string[]> => {
  const snap = await watchesCollection(uid).get()
  return snap.docs.map(doc => doc.id)
}

export const isWatching = async (
  uid: string,
  issueId: string,
): Promise<boolean> => (await watchRef(uid, issueId).get()).exists
