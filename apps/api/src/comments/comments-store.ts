import type {
  CommentCreateInput,
  CommentDeleteInput,
  CommentParent,
  CommentUpdateInput,
  PermissionRole,
} from '@raiymbek-park/shared/validation-schemas'
import type {
  CollectionReference,
  DocumentData,
} from 'firebase-admin/firestore'
import type { WriteOutcome } from '../store-helpers'

import { COMMENT_PAGE_SIZE } from '@raiymbek-park/shared/validation-schemas'

import { FieldValue, getDb, Timestamp } from '../firestore'
import { getResident } from '../resident/resident-store'
import { deleteCommentMedia } from '../storage'
import { toMillis, toNumber, toStringArray, toText } from '../store-helpers'

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
  media: string[]
  text: string
}

const parentCollection = (parent: CommentParent) =>
  getDb().collection(parent === 'post' ? 'posts' : 'issues')

const parentRef = (parent: CommentParent, parentId: string) =>
  parentCollection(parent).doc(parentId)

const commentsCollection = (
  parent: CommentParent,
  parentId: string,
): CollectionReference => parentRef(parent, parentId).collection('comments')

const parseComment = (
  id: string,
  data: DocumentData,
  uid: string | null,
): Comment => {
  const author =
    typeof data.author === 'object' && data.author !== null ? data.author : {}
  const authorId = toText(data.authorId)
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
    media: toStringArray(data.media),
    text: toText(data.text),
  }
}

type ListCommentsInput = {
  cursor?: number
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
  const comments = snap.docs.map(doc => parseComment(doc.id, doc.data(), uid))
  const last = comments.at(-1)
  const nextCursor =
    last && comments.length === COMMENT_PAGE_SIZE ? last.createdAt : null
  return { comments, nextCursor }
}

export const createComment = async (
  uid: string,
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
  return getDb().runTransaction<WriteOutcome>(async transaction => {
    const snap = await transaction.get(ref)
    if (!snap.exists) return 'not-found'
    if (!canModify(snap.data() ?? {}, uid, role)) return 'forbidden'
    transaction.update(ref, {
      editedAt: FieldValue.serverTimestamp(),
      media: input.media,
      text: input.text,
    })
    return 'ok'
  })
}

export const deleteComment = async (
  uid: string,
  role: PermissionRole,
  input: CommentDeleteInput,
): Promise<WriteOutcome> => {
  const parent = parentRef(input.parent, input.parentId)
  const ref = parent.collection('comments').doc(input.id)
  const outcome = await getDb().runTransaction<WriteOutcome>(
    async transaction => {
      const snap = await transaction.get(ref)
      if (!snap.exists) return 'not-found'
      if (!canModify(snap.data() ?? {}, uid, role)) return 'forbidden'
      transaction.delete(ref)
      transaction.update(parent, { commentCount: FieldValue.increment(-1) })
      return 'ok'
    },
  )
  if (outcome === 'ok') {
    await deleteCommentMedia(input.parent, input.parentId, input.id).catch(
      () => undefined,
    )
  }
  return outcome
}
