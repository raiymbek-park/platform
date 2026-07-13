import type { PermissionRole } from './issue'

import { z } from 'zod'

import { MEDIA_MAX_ITEMS, reactionKindSchema } from './issue'

export const postKinds = ['announcement', 'offer'] as const

export type PostKind = (typeof postKinds)[number]

export const postKindSchema = z.enum(postKinds)

export const creatablePostKinds = (role: PermissionRole): PostKind[] => {
  const canOffer =
    role === 'resident' || role === 'owner' || role === 'administration'
  const canAnnounce = role === 'manager' || role === 'administration'
  return [
    ...(canOffer ? (['offer'] as const) : []),
    ...(canAnnounce ? (['announcement'] as const) : []),
  ]
}

export const postTabs = ['all', 'announcements', 'offers'] as const

export type PostTab = (typeof postTabs)[number]

export const postTabSchema = z.enum(postTabs)

export const DEFAULT_POST_TAB: PostTab = 'all'

export const announcementCategories = [
  'complex',
  'management',
  'city',
  'other',
] as const

export type AnnouncementCategory = (typeof announcementCategories)[number]

export const offerCategories = [
  'sell',
  'rent',
  'services',
  'free',
  'wanted',
  'other',
] as const

export type OfferCategory = (typeof offerCategories)[number]

export type PostCategory = AnnouncementCategory | OfferCategory

export const announcementCategorySchema = z.enum(announcementCategories)
export const offerCategorySchema = z.enum(offerCategories)

export const POST_TITLE_MIN = 3
export const POST_TITLE_MAX = 80
export const POST_DESCRIPTION_MIN = 10
export const POST_DESCRIPTION_MAX = 1000
export const ANNOUNCEMENT_DESCRIPTION_MAX = 3000

export const postDescriptionMax = (kind: PostKind): number =>
  kind === 'announcement' ? ANNOUNCEMENT_DESCRIPTION_MAX : POST_DESCRIPTION_MAX

const titleSchema = z.string().trim().min(POST_TITLE_MIN).max(POST_TITLE_MAX)
const descriptionSchema = z
  .string()
  .trim()
  .min(POST_DESCRIPTION_MIN)
  .max(POST_DESCRIPTION_MAX)
const announcementDescriptionSchema = z
  .string()
  .trim()
  .min(POST_DESCRIPTION_MIN)
  .max(ANNOUNCEMENT_DESCRIPTION_MAX)
const mediaSchema = z.array(z.string()).max(MEDIA_MAX_ITEMS).default([])

const announcementFields = {
  category: announcementCategorySchema,
  description: announcementDescriptionSchema,
  kind: z.literal('announcement'),
  media: mediaSchema,
  title: titleSchema,
}

const offerFields = {
  category: offerCategorySchema,
  description: descriptionSchema,
  kind: z.literal('offer'),
  media: mediaSchema,
  title: titleSchema,
}

export const postCreateInputSchema = z.discriminatedUnion('kind', [
  z.object(announcementFields),
  z.object(offerFields),
])

export type PostCreateInput = z.infer<typeof postCreateInputSchema>

export const postCreatePayloadSchema = z.discriminatedUnion('kind', [
  z.object({ ...announcementFields, id: z.string().min(1) }),
  z.object({ ...offerFields, id: z.string().min(1) }),
])

export type PostCreatePayload = z.infer<typeof postCreatePayloadSchema>

export const postUpdateInputSchema = postCreatePayloadSchema

export type PostUpdateInput = z.infer<typeof postUpdateInputSchema>

export const postListInputSchema = z.object({
  cursor: z.number().optional(),
  search: z.string().optional(),
  tab: postTabSchema.default(DEFAULT_POST_TAB),
})

export type PostListInput = z.infer<typeof postListInputSchema>

export const postSearchSchema = z.object({
  tab: postTabSchema.catch(DEFAULT_POST_TAB),
})

export type PostSearch = z.infer<typeof postSearchSchema>

export const postRefInputSchema = z.object({
  postId: z.string().min(1),
})

export type PostRefInput = z.infer<typeof postRefInputSchema>

export const postReactionInputSchema = postRefInputSchema.extend({
  kind: reactionKindSchema,
})

export type PostReactionInput = z.infer<typeof postReactionInputSchema>

export const POST_PAGE_SIZE = 20
