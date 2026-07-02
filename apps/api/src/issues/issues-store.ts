import type {
  ClassificationTag,
  IssueCategory,
  IssueStatus,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'
import type { DocumentData } from 'firebase-admin/firestore'

import {
  classificationTags,
  issueCategories,
  issueStatuses,
  reactionKinds,
} from '@raiymbek-park/shared/validation-schemas'

import { getDb, Timestamp } from '../firestore'

export type IssueAuthor = {
  apartment: number
  block: number
  name: string
}

export type Issue = {
  author: IssueAuthor
  category: IssueCategory
  createdAt: number
  description: string
  dislikeCount: number
  id: string
  likeCount: number
  myReaction: ReactionKind | null
  number: number
  status: IssueStatus
  tags: ClassificationTag[]
  title: string
  urgent: boolean
}

const collection = () => getDb().collection('issues')

const toText = (value: unknown): string =>
  typeof value === 'string' ? value : ''

const toNumber = (value: unknown): number =>
  typeof value === 'number' ? value : 0

const toCategory = (value: unknown): IssueCategory =>
  issueCategories.find(category => category === value) ?? 'other'

const toStatus = (value: unknown): IssueStatus =>
  issueStatuses.find(status => status === value) ?? 'incoming'

const toTags = (value: unknown): ClassificationTag[] =>
  Array.isArray(value)
    ? classificationTags.filter(tag => value.includes(tag))
    : []

const toReactions = (value: unknown): Record<string, ReactionKind> => {
  if (typeof value !== 'object' || value === null) return {}
  return Object.fromEntries(
    Object.entries(value).flatMap(([uid, kind]) =>
      reactionKinds.some(k => k === kind) ? [[uid, kind as ReactionKind]] : [],
    ),
  )
}

const toAuthor = (value: unknown): IssueAuthor => {
  const author = typeof value === 'object' && value !== null ? value : {}
  const data = author as DocumentData
  return {
    apartment: toNumber(data.apartment),
    block: toNumber(data.block),
    name: toText(data.name),
  }
}

const parseIssue = (
  id: string,
  data: DocumentData,
  uid: string | null,
): Issue => {
  const reactions = toReactions(data.reactions)
  const kinds = Object.values(reactions)
  const createdAt =
    data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0
  return {
    author: toAuthor(data.author),
    category: toCategory(data.category),
    createdAt,
    description: toText(data.description),
    dislikeCount: kinds.filter(kind => kind === 'dislike').length,
    id,
    likeCount: kinds.filter(kind => kind === 'like').length,
    myReaction: uid ? (reactions[uid] ?? null) : null,
    number: toNumber(data.number),
    status: toStatus(data.status),
    tags: toTags(data.tags),
    title: toText(data.title),
    urgent: data.urgent === true,
  }
}

export const listIssues = async (
  status: IssueStatus,
  uid: string | null,
): Promise<Issue[]> => {
  const snap = await collection()
    .where('status', '==', status)
    .orderBy('createdAt', 'desc')
    .get()
  return snap.docs.map(doc => parseIssue(doc.id, doc.data(), uid))
}

export const setReaction = async (
  issueId: string,
  uid: string,
  kind: ReactionKind,
): Promise<void> => {
  const ref = collection().doc(issueId)
  await getDb().runTransaction(async transaction => {
    const snap = await transaction.get(ref)
    if (!snap.exists) return
    const reactions = toReactions(snap.data()?.reactions)
    const next =
      reactions[uid] === kind
        ? Object.fromEntries(
            Object.entries(reactions).filter(([key]) => key !== uid),
          )
        : { ...reactions, [uid]: kind }
    transaction.update(ref, { reactions: next })
  })
}
