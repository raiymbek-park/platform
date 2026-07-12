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
import type { DocumentData } from 'firebase-admin/firestore'
import type { Locale } from '../i18n'
import type { WriteOutcome } from '../store-helpers'

import {
  classificationTags,
  ISSUE_PAGE_SIZE,
  issueCategories,
  issueStatuses,
} from '@raiymbek-park/shared/validation-schemas'

import { FieldValue, getDb } from '../firestore'
import { getResident, residentSnapshot } from '../resident/resident-store'
import { deleteIssueMedia } from '../storage'
import {
  modifyWithOutcome,
  searchedPage,
  toggleReaction,
  toMillis,
  toNumber,
  toReactions,
  toStringArray,
  toText,
} from '../store-helpers'
import { localizedFields } from '../translation/localized-fields'
import { buildKeywords } from './keywords'
import { addWatch, getWatchedIssueIds, isWatching } from './watch-store'

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
  isTranslated: boolean
  isWatching: boolean
  keywords: string[]
  likeCount: number
  media: string[]
  myReaction: ReactionKind | null
  number: number
  original: { description: string; title: string } | null
  originalLang: Locale
  status: IssueStatus
  tags: ClassificationTag[]
  title: string
  urgent: boolean
}

const collection = () => getDb().collection('issues')

const toCategory = (value: unknown): IssueCategory =>
  issueCategories.find(category => category === value) ?? 'other'

export const toStatus = (value: unknown): IssueStatus =>
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
  locale: Locale,
  isWatched: boolean,
): Issue => {
  const reactions = toReactions(data.reactions)
  const kinds = Object.values(reactions)
  const author =
    typeof data.author === 'object' && data.author !== null ? data.author : {}
  const authorId = toText(data.authorId)
  return {
    ...localizedFields(data, locale),
    author: toAuthor(author, canSeePhone(role, uid, authorId)),
    category: toCategory(data.category),
    commentCount: toNumber(data.commentCount),
    createdAt: toMillis(data.createdAt),
    dislikeCount: kinds.filter(kind => kind === 'dislike').length,
    id,
    isMine: uid !== null && authorId !== '' && authorId === uid,
    isWatching: isWatched,
    keywords: toStringArray(data.keywords),
    likeCount: kinds.filter(kind => kind === 'like').length,
    media: toStringArray(data.media),
    myReaction: uid ? (reactions[uid] ?? null) : null,
    number: toNumber(data.number),
    status: toStatus(data.status),
    tags: toTags(data.tags),
    urgent: data.urgent === true,
  }
}

type ListIssuesInput = {
  cursor?: number
  locale: Locale
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
  locale,
  role,
  search,
  status,
  uid,
}: ListIssuesInput): Promise<ListIssuesResult> => {
  const scoped =
    status === 'all' ? collection() : collection().where('status', '==', status)
  const { paged } = searchedPage(scoped, search, cursor)
  const [snap, watchedIds] = await Promise.all([
    paged.limit(ISSUE_PAGE_SIZE).get(),
    uid ? getWatchedIssueIds(uid) : [],
  ])
  const watched = new Set(watchedIds)
  const issues = snap.docs.map(doc =>
    parseIssue(doc.id, doc.data(), uid, role, locale, watched.has(doc.id)),
  )
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
  locale: Locale,
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
      lang: locale,
      media: input.media,
      number,
      reactions: {},
      status: 'new',
      tags: [],
      title: input.title,
      urgent: input.urgent,
    })
    addWatch(transaction, uid, input.id)
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
  locale: Locale,
  issueId: string,
): Promise<Issue | null> => {
  const snap = await collection().doc(issueId).get()
  if (!snap.exists) return null
  const isWatched = uid ? await isWatching(uid, issueId) : false
  return parseIssue(snap.id, snap.data() ?? {}, uid, role, locale, isWatched)
}

export const updateIssue = (
  uid: string,
  role: PermissionRole,
  input: IssueUpdateInput,
): Promise<WriteOutcome> => {
  const ref = collection().doc(input.id)
  return modifyWithOutcome({
    canModify: canModifyIssue,
    ref,
    role,
    uid,
    write: (transaction, data) => {
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
    },
  })
}

export const changeStatus = async (
  uid: string,
  input: StatusChangeInput,
): Promise<boolean> => {
  const ref = collection().doc(input.issueId)
  const comment = input.comment ?? ''
  const resident = comment ? await getResident(uid) : null
  return getDb().runTransaction(async transaction => {
    const snap = await transaction.get(ref)
    if (!snap.exists) return false
    transaction.update(ref, {
      lastStatusAt: FieldValue.serverTimestamp(),
      lastStatusBy: uid,
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
    if (comment) {
      transaction.set(ref.collection('comments').doc(), {
        author: {
          apartment: resident?.apartment ?? 0,
          block: resident?.block ?? 0,
          name: resident?.name ?? '',
        },
        authorId: uid,
        createdAt: FieldValue.serverTimestamp(),
        media: input.media,
        text: comment,
      })
    }
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
  const outcome = await modifyWithOutcome({
    canModify: canModifyIssue,
    ref,
    role,
    uid,
    write: transaction => transaction.delete(ref),
  })
  if (outcome === 'ok') await deleteIssueMedia(issueId).catch(() => undefined)
  return outcome
}
