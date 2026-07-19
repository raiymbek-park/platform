import type {
  PermissionRole,
  PostCategory,
  PostCreatePayload,
  PostKind,
  PostTab,
  PostUpdateInput,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'
import type { DocumentData } from 'firebase-admin/firestore'
import type { Locale } from '../i18n'
import type { WriteOutcome } from '../store-helpers'

import {
  announcementCategories,
  offerCategories,
  POST_PAGE_SIZE,
  postKinds,
} from '@raiymbek-park/shared/validation-schemas'

import { FieldValue, getDb, Timestamp } from '../firestore'
import { getResident, residentSnapshot } from '../resident/resident-store'
import { deletePostMedia } from '../storage'
import {
  modifyWithOutcome,
  parseAuthorMeta,
  searchedPage,
  toggleReaction,
  toMillis,
  toNumber,
  toStringArray,
  toText,
} from '../store-helpers'
import { localizedFields } from '../translation/localized-fields'
import { buildPostKeywords } from './keywords'

export type PostAuthor = {
  apartment: number
  block: number
  name: string
  phone?: string
}

export type Post = {
  author: PostAuthor
  category: PostCategory
  commentCount: number
  createdAt: number
  description: string
  dislikeCount: number
  id: string
  isMine: boolean
  isPinned: boolean
  isTranslated: boolean
  keywords: string[]
  kind: PostKind
  likeCount: number
  media: string[]
  myReaction: ReactionKind | null
  original: { description: string; title: string } | null
  originalLang: Locale
  title: string
}

const collection = () => getDb().collection('posts')

const categories = [...announcementCategories, ...offerCategories]

const toKind = (value: unknown): PostKind =>
  postKinds.find(kind => kind === value) ?? 'offer'

export const toCategory = (value: unknown): PostCategory =>
  categories.find(category => category === value) ?? 'other'

const toAuthor = (data: DocumentData, canSeePhone: boolean): PostAuthor => ({
  apartment: toNumber(data.apartment),
  block: toNumber(data.block),
  name: toText(data.name),
  ...(canSeePhone ? { phone: toText(data.phone) } : {}),
})

const parsePost = (
  id: string,
  data: DocumentData,
  uid: string | null,
  locale: Locale,
): Post => {
  const { author, authorId, kinds, reactions } = parseAuthorMeta(data)
  const kind = toKind(data.kind)
  return {
    ...localizedFields(data, locale),
    author: toAuthor(author, kind === 'offer' && uid !== null),
    category: toCategory(data.category),
    commentCount: toNumber(data.commentCount),
    createdAt: toMillis(data.createdAt),
    dislikeCount: kinds.filter(reaction => reaction === 'dislike').length,
    id,
    isMine: uid !== null && authorId !== '' && authorId === uid,
    isPinned:
      data.pinnedUntil instanceof Timestamp &&
      data.pinnedUntil.toMillis() > Date.now(),
    keywords: toStringArray(data.keywords),
    kind,
    likeCount: kinds.filter(reaction => reaction === 'like').length,
    media: toStringArray(data.media),
    myReaction: uid ? (reactions[uid] ?? null) : null,
  }
}

type ListPostsInput = {
  cursor?: number
  locale: Locale
  search?: string
  tab: PostTab
  uid: string | null
}

type ListPostsResult = {
  nextCursor: number | null
  posts: Post[]
}

const kindForTab = (tab: PostTab): PostKind | null => {
  if (tab === 'announcements') return 'announcement'
  if (tab === 'offers') return 'offer'
  return null
}

const PINNED_LIMIT = 10

const listPinned = async (
  kind: PostKind | null,
  uid: string | null,
  locale: Locale,
): Promise<Post[]> => {
  const scoped = kind ? collection().where('kind', '==', kind) : collection()
  const snap = await scoped
    .where('pinnedUntil', '>', Timestamp.now())
    .orderBy('pinnedUntil', 'desc')
    .limit(PINNED_LIMIT)
    .get()
  return snap.docs.map(doc => parsePost(doc.id, doc.data(), uid, locale))
}

export const listPosts = async ({
  cursor,
  locale,
  search,
  tab,
  uid,
}: ListPostsInput): Promise<ListPostsResult> => {
  const kind = kindForTab(tab)
  const scoped = kind ? collection().where('kind', '==', kind) : collection()
  const { paged, terms } = searchedPage(scoped, search, cursor)
  const isFirstPlainPage = cursor === undefined && terms.length === 0
  const [pinned, snap] = await Promise.all([
    isFirstPlainPage ? listPinned(kind, uid, locale) : Promise.resolve([]),
    paged.limit(POST_PAGE_SIZE).get(),
  ])
  const pinnedIds = new Set(pinned.map(post => post.id))
  const page = snap.docs.map(doc => parsePost(doc.id, doc.data(), uid, locale))
  const last = page.at(-1)
  const nextCursor =
    last && page.length === POST_PAGE_SIZE ? last.createdAt : null
  const posts = [...pinned, ...page.filter(post => !pinnedIds.has(post.id))]
  return { nextCursor, posts }
}

export const setPostReaction = (
  postId: string,
  uid: string,
  kind: ReactionKind,
): Promise<boolean> => toggleReaction(collection().doc(postId), uid, kind)

export const createPost = async (
  uid: string,
  locale: Locale,
  input: PostCreatePayload,
): Promise<{ id: string }> => {
  const author = residentSnapshot(await getResident(uid))
  await collection()
    .doc(input.id)
    .create({
      author,
      authorId: uid,
      category: input.category,
      commentCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      description: input.description,
      keywords: buildPostKeywords([input.title]),
      kind: input.kind,
      lang: locale,
      media: input.media,
      reactions: {},
      title: input.title,
    })
  return { id: input.id }
}

export const getPost = async (
  uid: string | null,
  locale: Locale,
  postId: string,
): Promise<Post | null> => {
  const snap = await collection().doc(postId).get()
  if (!snap.exists) return null
  return parsePost(snap.id, snap.data() ?? {}, uid, locale)
}

const canModifyPost = (
  data: DocumentData,
  uid: string,
  role: PermissionRole,
): boolean => toText(data.authorId) === uid || role === 'administration'

export const updatePost = (
  uid: string,
  role: PermissionRole,
  input: PostUpdateInput,
): Promise<WriteOutcome> => {
  const ref = collection().doc(input.id)
  return modifyWithOutcome({
    canModify: canModifyPost,
    ref,
    role,
    uid,
    write: transaction => {
      transaction.update(ref, {
        category: input.category,
        description: input.description,
        keywords: buildPostKeywords([input.title]),
        media: input.media,
        title: input.title,
      })
    },
  })
}

export const deletePost = async (
  uid: string,
  role: PermissionRole,
  postId: string,
): Promise<WriteOutcome> => {
  const ref = collection().doc(postId)
  const outcome = await modifyWithOutcome({
    canModify: canModifyPost,
    ref,
    role,
    uid,
    write: transaction => transaction.delete(ref),
  })
  if (outcome === 'ok') await deletePostMedia(postId).catch(() => undefined)
  return outcome
}
