import type {
  ClassificationTag,
  IssueCategory,
  IssueCreatePayload,
  IssueFilter,
  IssueStatus,
  IssueUpdateInput,
  PermissionRole,
  ReactionKind,
  StatusChangeInput,
} from '@raiymbek-park/shared/validation-schemas'
import type {
  DocumentData,
  DocumentReference,
  Transaction,
} from 'firebase-admin/firestore'
import type { WriteOutcome } from '../store-helpers'

import { searchTerms } from '@raiymbek-park/shared'
import {
  classificationTags,
  ISSUE_PAGE_SIZE,
  issueCategories,
  issueStatuses,
} from '@raiymbek-park/shared/validation-schemas'

import { FieldValue, getDb, Timestamp } from '../firestore'
import { getResident, residentSnapshot } from '../resident/resident-store'
import { deleteIssueMedia } from '../storage'
import {
  toggleReaction,
  toNumber,
  toReactions,
  toStringArray,
  toText,
} from '../store-helpers'
import { buildKeywords } from './keywords'

const SEARCH_TERM_LIMIT = 30

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
  isMine: boolean
  keywords: string[]
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

const toCategory = (value: unknown): IssueCategory =>
  issueCategories.find(category => category === value) ?? 'other'

const toStatus = (value: unknown): IssueStatus =>
  issueStatuses.find(status => status === value) ?? 'new'

const toTags = (value: unknown): ClassificationTag[] =>
  Array.isArray(value)
    ? classificationTags.filter(tag => value.includes(tag))
    : []

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
  const authorId = toText(data.authorId)
  return {
    author: toAuthor(author, canSeePhone(role, uid, authorId)),
    category: toCategory(data.category),
    commentCount: toNumber(data.commentCount),
    createdAt,
    description: toText(data.description),
    dislikeCount: kinds.filter(kind => kind === 'dislike').length,
    id,
    isMine: uid !== null && authorId !== '' && authorId === uid,
    keywords: toStringArray(data.keywords),
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
  search?: string
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
  search,
  status,
  uid,
}: ListIssuesInput): Promise<ListIssuesResult> => {
  const scoped =
    status === 'all' ? collection() : collection().where('status', '==', status)
  const terms = searchTerms(search ?? '').slice(0, SEARCH_TERM_LIMIT)
  const searched = terms.length
    ? scoped.where('keywords', 'array-contains-any', terms)
    : scoped
  const ordered = searched.orderBy('createdAt', 'desc')
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

export const setIssueReaction = (
  issueId: string,
  uid: string,
  kind: ReactionKind,
): Promise<boolean> => toggleReaction(collection().doc(issueId), uid, kind)

const counterRef = () => getDb().collection('counters').doc('issues')

const nextNumber = (value: unknown): number => toNumber(value) + 1

export const createIssue = async (
  uid: string,
  input: IssueCreatePayload,
): Promise<{ id: string; number: number }> => {
  const author = residentSnapshot(await getResident(uid))
  return getDb().runTransaction(async transaction => {
    const counter = counterRef()
    const snap = await transaction.get(counter)
    const number = nextNumber(snap.data()?.value)
    const issueRef = collection().doc(input.id)
    transaction.set(counter, { value: number }, { merge: true })
    transaction.create(issueRef, {
      author,
      authorId: uid,
      category: input.category,
      commentCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      description: input.description,
      keywords: buildKeywords({ number, titles: [input.title] }),
      media: input.media,
      number,
      reactions: {},
      status: 'new',
      tags: [],
      title: input.title,
      urgent: input.urgent,
    })
    return { id: input.id, number }
  })
}

const canModifyIssue = (
  data: DocumentData,
  uid: string,
  role: PermissionRole,
): boolean => {
  const isNew = toStatus(data.status) === 'new'
  const isAuthor = toText(data.authorId) === uid
  return isNew && (isAuthor || role === 'administration')
}

export const getIssue = async (
  uid: string | null,
  role: PermissionRole | null,
  issueId: string,
): Promise<Issue | null> => {
  const snap = await collection().doc(issueId).get()
  if (!snap.exists) return null
  return parseIssue(snap.id, snap.data() ?? {}, uid, role)
}

const modifyIssue = (
  ref: DocumentReference,
  uid: string,
  role: PermissionRole,
  write: (transaction: Transaction, data: DocumentData) => void,
): Promise<WriteOutcome> =>
  getDb().runTransaction<WriteOutcome>(async transaction => {
    const snap = await transaction.get(ref)
    if (!snap.exists) return 'not-found'
    const data = snap.data() ?? {}
    if (!canModifyIssue(data, uid, role)) return 'forbidden'
    write(transaction, data)
    return 'ok'
  })

export const updateIssue = (
  uid: string,
  role: PermissionRole,
  input: IssueUpdateInput,
): Promise<WriteOutcome> => {
  const ref = collection().doc(input.id)
  return modifyIssue(ref, uid, role, (transaction, data) => {
    transaction.update(ref, {
      category: input.category,
      description: input.description,
      keywords: buildKeywords({
        number: toNumber(data.number),
        titles: [input.title],
      }),
      media: input.media,
      title: input.title,
      urgent: input.urgent,
    })
  })
}

export const changeStatus = async (
  uid: string,
  input: StatusChangeInput,
): Promise<boolean> => {
  const ref = collection().doc(input.issueId)
  return getDb().runTransaction(async transaction => {
    const snap = await transaction.get(ref)
    if (!snap.exists) return false
    const comment = input.comment ?? ''
    transaction.update(ref, {
      status: input.status,
      tags: input.tags,
      ...(comment ? { commentCount: FieldValue.increment(1) } : {}),
    })
    transaction.set(ref.collection('statusChanges').doc(), {
      authorId: uid,
      comment,
      createdAt: FieldValue.serverTimestamp(),
      media: input.media,
      status: input.status,
      tags: input.tags,
    })
    return true
  })
}

export type DeleteOutcome = WriteOutcome

export const deleteIssue = async (
  uid: string,
  role: PermissionRole,
  issueId: string,
): Promise<DeleteOutcome> => {
  const ref = collection().doc(issueId)
  const outcome = await modifyIssue(ref, uid, role, transaction =>
    transaction.delete(ref),
  )
  if (outcome === 'ok') await deleteIssueMedia(issueId).catch(() => undefined)
  return outcome
}
