import type {
  ClassificationTag,
  IssueCategory,
  IssueFilter,
  IssueStatus,
  PermissionRole,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'
import type { DocumentData } from 'firebase-admin/firestore'

import {
  classificationTags,
  ISSUE_PAGE_SIZE,
  issueCategories,
  issueStatuses,
  reactionKinds,
} from '@raiymbek-park/shared/validation-schemas'

import { getDb, Timestamp } from '../firestore'

export type IssueAuthor = {
  apartment: number
  block: number
  name: string
  phone?: string
}

export type Issue = {
  author: IssueAuthor
  category: IssueCategory
  commentCount: number
  createdAt: number
  description: string
  dislikeCount: number
  id: string
  likeCount: number
  media: string[]
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
  issueStatuses.find(status => status === value) ?? 'new'

const toTags = (value: unknown): ClassificationTag[] =>
  Array.isArray(value)
    ? classificationTags.filter(tag => value.includes(tag))
    : []

const toStringArray = (value: unknown): string[] =>
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

const toAuthor = (data: DocumentData, canSeePhone: boolean): IssueAuthor => ({
  apartment: toNumber(data.apartment),
  block: toNumber(data.block),
  name: toText(data.name),
  ...(canSeePhone ? { phone: toText(data.phone) } : {}),
})

const canSeePhone = (
  role: PermissionRole | null,
  uid: string | null,
  authorId: string,
): boolean =>
  role === 'manager' ||
  role === 'administration' ||
  (uid !== null && authorId !== '' && authorId === uid)

const parseIssue = (
  id: string,
  data: DocumentData,
  uid: string | null,
  role: PermissionRole | null,
): Issue => {
  const reactions = toReactions(data.reactions)
  const kinds = Object.values(reactions)
  const createdAt =
    data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0
  const author =
    typeof data.author === 'object' && data.author !== null ? data.author : {}
  return {
    author: toAuthor(author, canSeePhone(role, uid, toText(data.authorId))),
    category: toCategory(data.category),
    commentCount: toNumber(data.commentCount),
    createdAt,
    description: toText(data.description),
    dislikeCount: kinds.filter(kind => kind === 'dislike').length,
    id,
    likeCount: kinds.filter(kind => kind === 'like').length,
    media: toStringArray(data.media),
    myReaction: uid ? (reactions[uid] ?? null) : null,
    number: toNumber(data.number),
    status: toStatus(data.status),
    tags: toTags(data.tags),
    title: toText(data.title),
    urgent: data.urgent === true,
  }
}

type ListIssuesInput = {
  cursor?: number
  role: PermissionRole | null
  status: IssueFilter
  uid: string | null
}

type ListIssuesResult = {
  issues: Issue[]
  nextCursor: number | null
}

export const listIssues = async ({
  cursor,
  role,
  status,
  uid,
}: ListIssuesInput): Promise<ListIssuesResult> => {
  const scoped =
    status === 'all' ? collection() : collection().where('status', '==', status)
  const ordered = scoped.orderBy('createdAt', 'desc')
  const paged =
    cursor === undefined
      ? ordered
      : ordered.startAfter(Timestamp.fromMillis(cursor))
  const snap = await paged.limit(ISSUE_PAGE_SIZE).get()
  const issues = snap.docs.map(doc => parseIssue(doc.id, doc.data(), uid, role))
  const last = issues.at(-1)
  const nextCursor =
    last && issues.length === ISSUE_PAGE_SIZE ? last.createdAt : null
  return { issues, nextCursor }
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
