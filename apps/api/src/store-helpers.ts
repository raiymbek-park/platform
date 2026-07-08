import type { ReactionKind } from '@raiymbek-park/shared/validation-schemas'
import type { DocumentReference } from 'firebase-admin/firestore'

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

export const toReactions = (value: unknown): Record<string, ReactionKind> => {
  if (typeof value !== 'object' || value === null) return {}
  return Object.fromEntries(
    Object.entries(value).flatMap(([uid, kind]) =>
      isReactionKind(kind) ? [[uid, kind]] : [],
    ),
  )
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
