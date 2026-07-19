import type {
  PermissionRole,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'
import type {
  DocumentData,
  DocumentReference,
  Query,
  Transaction,
} from 'firebase-admin/firestore'

import { searchTerms } from '@raiymbek-park/shared'
import { reactionKinds } from '@raiymbek-park/shared/validation-schemas'

import { getDb, Timestamp } from './firestore'

export type WriteOutcome = 'ok' | 'not-found' | 'forbidden'

export const toText = (value: unknown): string =>
  typeof value === 'string' ? value : ''

export const toNumber = (value: unknown): number =>
  typeof value === 'number' ? value : 0

export const toMillis = (value: unknown): number =>
  value instanceof Timestamp ? value.toMillis() : 0

export const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter(item => typeof item === 'string') : []

const isReactionKind = (kind: string): kind is ReactionKind =>
  reactionKinds.some(x => x === kind)

const toReactions = (value: unknown): Record<string, ReactionKind> => {
  if (typeof value !== 'object' || value === null) return {}
  return Object.fromEntries(
    Object.entries(value).flatMap(([uid, kind]) =>
      isReactionKind(kind) ? [[uid, kind]] : [],
    ),
  )
}

export const parseAuthorMeta = (data: DocumentData) => {
  const reactions = toReactions(data.reactions)
  const author: DocumentData =
    typeof data.author === 'object' && data.author !== null ? data.author : {}
  return {
    author,
    authorId: toText(data.authorId),
    kinds: Object.values(reactions),
    reactions,
  }
}

export const toggleReaction = (
  ref: DocumentReference,
  uid: string,
  kind: ReactionKind,
): Promise<boolean> =>
  getDb().runTransaction(async transaction => {
    const snap = await transaction.get(ref)
    if (!snap.exists) return false
    const reactions = toReactions(snap.data()?.reactions)
    const next =
      reactions[uid] === kind
        ? Object.fromEntries(
            Object.entries(reactions).filter(([key]) => key !== uid),
          )
        : { ...reactions, [uid]: kind }
    transaction.update(ref, { reactions: next })
    return true
  })

const SEARCH_TERM_LIMIT = 30

export const searchedPage = (
  scoped: Query,
  search: string | undefined,
  cursor: number | undefined,
): { paged: Query; terms: string[] } => {
  const terms = searchTerms(search ?? '').slice(0, SEARCH_TERM_LIMIT)
  const searched = terms.length
    ? scoped.where('keywords', 'array-contains-any', terms)
    : scoped
  const ordered = searched.orderBy('createdAt', 'desc')
  const paged =
    cursor === undefined
      ? ordered
      : ordered.startAfter(Timestamp.fromMillis(cursor))
  return { paged, terms }
}

type ModifyOptions = {
  canModify: (data: DocumentData, uid: string, role: PermissionRole) => boolean
  ref: DocumentReference
  role: PermissionRole
  uid: string
  write: (transaction: Transaction, data: DocumentData) => void
}

export const modifyWithOutcome = ({
  canModify,
  ref,
  role,
  uid,
  write,
}: ModifyOptions): Promise<WriteOutcome> =>
  getDb().runTransaction<WriteOutcome>(async transaction => {
    const snap = await transaction.get(ref)
    if (!snap.exists) return 'not-found'
    const data = snap.data() ?? {}
    if (!canModify(data, uid, role)) return 'forbidden'
    write(transaction, data)
    return 'ok'
  })
