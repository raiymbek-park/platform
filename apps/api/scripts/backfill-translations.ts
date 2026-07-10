import type { MessageBatchResult } from '@anthropic-ai/sdk/resources/messages/batches'
import type {
  DocumentData,
  DocumentReference,
  Firestore,
} from 'firebase-admin/firestore'
import type { DocumentTranslation } from '../src/translation/translation-client'

import { setTimeout as sleep } from 'node:timers/promises'

import Anthropic from '@anthropic-ai/sdk'

import { getDb } from '../src/firestore'
import { resolveLocale } from '../src/i18n'
import { buildKeywords } from '../src/issues/keywords'
import { buildPostKeywords } from '../src/posts/keywords'
import { toNumber, toText } from '../src/store-helpers'
import { hashSource } from '../src/translation/hash-source'
import { translateDocumentFields } from '../src/translation/translate-document-fields'
import {
  documentTranslationParams,
  parseDocumentTranslation,
} from '../src/translation/translation-client'

type CollectionName = 'posts' | 'issues'

type PendingDoc = {
  collection: CollectionName
  data: DocumentData
  ref: DocumentReference
}

const POLL_INTERVAL_MS = 10_000

const log = (message: string): void => {
  console.log(message)
}

const needsTranslation = (data: DocumentData): boolean => {
  const title = toText(data.title)
  const description = toText(data.description)
  if (!title && !description) return false
  return toText(data.translatedRev) !== hashSource(title, description)
}

const scanCollection = async (
  db: Firestore,
  collection: CollectionName,
): Promise<{ pending: PendingDoc[]; total: number }> => {
  const snap = await db.collection(collection).get()
  const pending = snap.docs
    .filter(doc => needsTranslation(doc.data()))
    .map(doc => ({ collection, data: doc.data(), ref: doc.ref }))
  log(`${collection}: ${snap.size} document(s), ${pending.length} to translate`)
  return { pending, total: snap.size }
}

const toBatchRequest = ({ collection, data, ref }: PendingDoc) => ({
  custom_id: `${collection}_${ref.id}`,
  params: documentTranslationParams({
    sourceLocaleHint: resolveLocale(toText(data.lang)),
    texts: {
      description: toText(data.description),
      title: toText(data.title),
    },
  }),
})

const awaitBatchEnd = async (client: Anthropic, id: string): Promise<void> => {
  const batch = await client.messages.batches.retrieve(id)
  if (batch.processing_status === 'ended') return
  log(
    `batch ${id}: ${batch.processing_status} — ${batch.request_counts.processing} request(s) still processing`,
  )
  await sleep(POLL_INTERVAL_MS)
  return awaitBatchEnd(client, id)
}

const translationFrom = (
  result: MessageBatchResult,
): DocumentTranslation | null => {
  if (result.type !== 'succeeded') return null
  const [raw] = result.message.content.flatMap(block =>
    block.type === 'text' ? [block.text] : [],
  )
  return raw === undefined ? null : parseDocumentTranslation(raw)
}

const collectResults = async (
  client: Anthropic,
  id: string,
): Promise<Map<string, DocumentTranslation | null>> => {
  const results = new Map<string, DocumentTranslation | null>()
  for await (const response of await client.messages.batches.results(id)) {
    results.set(response.custom_id, translationFrom(response.result))
  }
  return results
}

const keywordsBuilder = ({ collection, data }: PendingDoc) =>
  collection === 'issues'
    ? (titles: string[]) =>
        buildKeywords({ number: toNumber(data.number), titles })
    : buildPostKeywords

const applyTranslation = async (
  doc: PendingDoc,
  translation: DocumentTranslation | null,
): Promise<'translated' | 'failed'> => {
  const id = `${doc.collection}/${doc.ref.id}`
  const write = await translateDocumentFields({
    buildKeywords: keywordsBuilder(doc),
    data: doc.data,
    translate: () => Promise.resolve(translation),
  })
  if (!write) {
    log(`${id}: failed — no valid translation in the batch result`)
    return 'failed'
  }
  await doc.ref.update(write)
  log(`${id}: translated from ${write.lang}`)
  return 'translated'
}

const run = async (): Promise<void> => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is required — set it in the environment before running the backfill',
    )
  }
  const db = getDb()
  const scans = await Promise.all([
    scanCollection(db, 'posts'),
    scanCollection(db, 'issues'),
  ])
  const total = scans.reduce((sum, scan) => sum + scan.total, 0)
  const pending = scans.flatMap(scan => scan.pending)
  if (pending.length === 0) {
    log(`Backfill complete: ${total} scanned, nothing to translate.`)
    return
  }
  const client = new Anthropic({ apiKey })
  const batch = await client.messages.batches.create({
    requests: pending.map(toBatchRequest),
  })
  log(`batch ${batch.id}: submitted ${pending.length} request(s)`)
  await awaitBatchEnd(client, batch.id)
  const results = await collectResults(client, batch.id)
  const outcomes = await Promise.all(
    pending.map(doc =>
      applyTranslation(
        doc,
        results.get(`${doc.collection}_${doc.ref.id}`) ?? null,
      ),
    ),
  )
  const translated = outcomes.filter(outcome => outcome === 'translated').length
  log(
    `Backfill complete: ${total} scanned, ${translated} translated, ${total - pending.length} skipped (already translated or empty), ${outcomes.length - translated} failed.`,
  )
}

run().then(
  () => process.exit(0),
  error => {
    console.error(error)
    process.exit(1)
  },
)
