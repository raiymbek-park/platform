import type { Firestore } from 'firebase-admin/firestore'

import { getStorage } from 'firebase-admin/storage'

import { getDb } from '../src/firestore'
import { resolveBucketName } from '../src/storage'

const apply = process.argv.includes('--apply')

const log = (message: string): void => {
  console.log(message)
}

const resolveBucket = async () => getStorage().bucket(await resolveBucketName())

type StorageBucket = Awaited<ReturnType<typeof resolveBucket>>

const moveIssueObjects = async (bucket: StorageBucket): Promise<void> => {
  const [files] = await bucket.getFiles({ prefix: 'assets/issues/' })
  log(`[A] storage: ${files.length} object(s) under assets/issues/`)
  await Promise.all(
    files.map(async file => {
      const newName = file.name.replace(/^assets\//, '')
      log(`[A] copy  ${file.name} → ${newName}`)
      if (apply) await file.copy(bucket.file(newName))
    }),
  )
}

const rewriteIssueMediaUrls = async (db: Firestore): Promise<void> => {
  const snap = await db.collection('issues').get()
  const updates = snap.docs.flatMap(doc => {
    const media = doc.data().media
    if (!Array.isArray(media)) return []
    const next = media.map((url: string) =>
      url.replace('assets%2Fissues%2F', 'issues%2F'),
    )
    const changed = next.some((url, index) => url !== media[index])
    return changed ? [{ id: doc.id, next, ref: doc.ref }] : []
  })
  log(`[B] firestore: ${updates.length} issue doc(s) need media URL rewrite`)
  await Promise.all(
    updates.map(async ({ id, next, ref }) => {
      log(`[B] issues/${id}: rewrite ${next.length} media URL(s)`)
      if (apply) await ref.update({ media: next })
    }),
  )
}

const copyServiceContacts = async (db: Firestore): Promise<void> => {
  const snap = await db.collection('serviceContacts').get()
  log(`[C] firestore: ${snap.size} serviceContacts doc(s) to copy`)
  await Promise.all(
    snap.docs.map(async doc => {
      log(`[C] copy  serviceContacts/${doc.id} → service-contacts/${doc.id}`)
      if (apply) {
        await db.collection('service-contacts').doc(doc.id).set(doc.data())
      }
    }),
  )
}

const deleteLegacy = async (
  bucket: StorageBucket,
  db: Firestore,
): Promise<void> => {
  const snap = await db.collection('serviceContacts').get()
  log('[D] cleanup targets:')
  log('[D]   storage prefix  assets/issues/')
  log('[D]   storage prefix  users/')
  log(`[D]   firestore serviceContacts (${snap.size} doc(s))`)
  if (!apply) {
    log('[D] skipped — dry-run')
    return
  }
  await bucket.deleteFiles({ prefix: 'assets/issues/' })
  await bucket.deleteFiles({ prefix: 'users/' })
  await Promise.all(snap.docs.map(doc => doc.ref.delete()))
  log('[D] legacy objects and docs deleted')
}

const run = async (): Promise<void> => {
  log(apply ? '=== MIGRATION — APPLY ===' : '=== MIGRATION — DRY-RUN ===')
  const db = getDb()
  const bucket = await resolveBucket()
  log(`bucket: ${bucket.name}`)

  await moveIssueObjects(bucket)
  await rewriteIssueMediaUrls(db)
  await copyServiceContacts(db)
  await deleteLegacy(bucket, db)

  log(apply ? '=== DONE — applied ===' : '=== DONE — dry-run, no changes ===')
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
