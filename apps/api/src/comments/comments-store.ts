import type {
  CommentCreateInput,
  CommentDeleteInput,
  CommentParent,
  CommentTranslateInput,
  CommentUpdateInput,
  PermissionRole,
} from '@raiymbek-park/shared/validation-schemas'
import type {
  CollectionReference,
  DocumentData,
} from 'firebase-admin/firestore'
import type { Locale } from '../i18n'
import type { WriteOutcome } from '../store-helpers'

import { COMMENT_PAGE_SIZE } from '@raiymbek-park/shared/validation-schemas'

import { FieldValue, getDb, Timestamp } from '../firestore'
import { resolveLocale } from '../i18n'
import { getResident } from '../resident/resident-store'
import { deleteCommentMedia } from '../storage'
import {
  modifyWithOutcome,
  toMillis,
  toNumber,
  toStringArray,
  toText,
} from '../store-helpers'
import { translateText } from '../translation/translation-client'

export type CommentAuthor = {
  apartment: number
  block: number
  name: string
}

export type Comment = {
  author: CommentAuthor
  createdAt: number
  editedAt: number | null
  id: string
  isMine: boolean
  lang: Locale
  media: string[]
  text: string
  translation: string | null
}

const parentCollection = (parent: CommentParent) =>
  getDb().collection(parent === 'post' ? 'posts' : 'issues')

const parentRef = (parent: CommentParent, parentId: string) =>
  parentCollection(parent).doc(parentId)

const commentsCollection = (
  parent: CommentParent,
  parentId: string,
): CollectionReference => parentRef(parent, parentId).collection('comments')

const cachedTranslation = (data: DocumentData, locale: Locale): string =>
  toText(data.translations?.[locale]?.text)

const parseComment = (
  id: string,
  data: DocumentData,
  uid: string | null,
  locale: Locale,
): Comment => {
  const author =
    typeof data.author === 'object' && data.author !== null ? data.author : {}
  const authorId = toText(data.authorId)
  const translation = cachedTranslation(data, locale)
  return {
    author: {
      apartment: toNumber(author.apartment),
      block: toNumber(author.block),
      name: toText(author.name),
    },
    createdAt: toMillis(data.createdAt),
    editedAt:
      data.editedAt instanceof Timestamp ? data.editedAt.toMillis() : null,
    id,
    isMine: uid !== null && authorId !== '' && authorId === uid,
    lang: resolveLocale(toText(data.lang)),
    media: toStringArray(data.media),
    text: toText(data.text),
    translation: translation || null,
  }
}

type ListCommentsInput = {
  cursor?: number
  locale: Locale
  parent: CommentParent
  parentId: string
  uid: string | null
}

type ListCommentsResult = {
  comments: Comment[]
  nextCursor: number | null
}

export const listComments = async ({
  cursor,
  locale,
  parent,
  parentId,
  uid,
}: ListCommentsInput): Promise<ListCommentsResult> => {
  const ordered = commentsCollection(parent, parentId).orderBy(
    'createdAt',
    'asc',
  )
  const paged =
    cursor === undefined
      ? ordered
      : ordered.startAfter(Timestamp.fromMillis(cursor))
  const snap = await paged.limit(COMMENT_PAGE_SIZE).get()
  const comments = snap.docs.map(doc =>
    parseComment(doc.id, doc.data(), uid, locale),
  )
  const last = comments.at(-1)
  const nextCursor =
    last && comments.length === COMMENT_PAGE_SIZE ? last.createdAt : null
  return { comments, nextCursor }
}

export const createComment = async (
  uid: string,
  locale: Locale,
  input: CommentCreateInput,
): Promise<WriteOutcome> => {
  const resident = await getResident(uid)
  const author: CommentAuthor = {
    apartment: resident?.apartment ?? 0,
    block: resident?.block ?? 0,
    name: resident?.name ?? '',
  }
  const parent = parentRef(input.parent, input.parentId)
  const commentRef = parent.collection('comments').doc(input.id)
  return getDb().runTransaction<WriteOutcome>(async transaction => {
    const snap = await transaction.get(parent)
    if (!snap.exists) return 'not-found'
    transaction.create(commentRef, {
      author,
      authorId: uid,
      createdAt: FieldValue.serverTimestamp(),
      lang: locale,
      media: input.media,
      text: input.text,
    })
    transaction.update(parent, { commentCount: FieldValue.increment(1) })
    return 'ok'
  })
}

const canModify = (data: DocumentData, uid: string, role: PermissionRole) =>
  toText(data.authorId) === uid || role === 'administration'

export const updateComment = (
  uid: string,
  role: PermissionRole,
  input: CommentUpdateInput,
): Promise<WriteOutcome> => {
  const ref = commentsCollection(input.parent, input.parentId).doc(input.id)
  return modifyWithOutcome({
    canModify,
    ref,
    role,
    uid,
    write: transaction =>
      transaction.update(ref, {
        editedAt: FieldValue.serverTimestamp(),
        media: input.media,
        text: input.text,
      }),
  })
}

export const deleteComment = async (
  uid: string,
  role: PermissionRole,
  input: CommentDeleteInput,
): Promise<WriteOutcome> => {
  const parent = parentRef(input.parent, input.parentId)
  const ref = parent.collection('comments').doc(input.id)
  const outcome = await modifyWithOutcome({
    canModify,
    ref,
    role,
    uid,
    write: transaction => {
      transaction.delete(ref)
      transaction.update(parent, { commentCount: FieldValue.increment(-1) })
    },
  })
  if (outcome === 'ok') {
    await deleteCommentMedia(input.parent, input.parentId, input.id).catch(
      () => undefined,
    )
  }
  return outcome
}

export type CommentTranslation = {
  lang: Locale
  text: string
}

export const translateComment = async (
  locale: Locale,
  input: CommentTranslateInput,
): Promise<CommentTranslation | 'not-found' | 'failed'> => {
  const ref = commentsCollection(input.parent, input.parentId).doc(input.id)
  const snap = await ref.get()
  const data = snap.data()
  if (!data) return 'not-found'
  const lang = resolveLocale(toText(data.lang))
  const cached = cachedTranslation(data, locale)
  if (cached) return { lang, text: cached }
  const text = toText(data.text)
  if (!text) return { lang, text }
  const result = await translateText({
    apiKey: toText(process.env.ANTHROPIC_API_KEY),
    sourceLocaleHint: lang,
    text,
  }).catch(() => null)
  if (!result) return 'failed'
  await ref.update({ lang: result.lang, translations: result.translations })
  return {
    lang: result.lang,
    text: result.translations[locale]?.text ?? text,
  }
}
