import { z } from 'zod'

import { MEDIA_MAX_ITEMS } from './issue'

export const commentParents = ['post', 'issue'] as const

export type CommentParent = (typeof commentParents)[number]

export const commentParentSchema = z.enum(commentParents)

export const COMMENT_TEXT_MAX = 1000

export const COMMENT_PAGE_SIZE = 30

const textSchema = z.string().trim().max(COMMENT_TEXT_MAX).default('')
const mediaSchema = z.array(z.string()).max(MEDIA_MAX_ITEMS).default([])

const hasContent = (value: { media: string[]; text: string }): boolean =>
  value.text.length > 0 || value.media.length > 0

export const commentTargetSchema = z.object({
  parent: commentParentSchema,
  parentId: z.string().min(1),
})

export type CommentTarget = z.infer<typeof commentTargetSchema>

export const commentListInputSchema = commentTargetSchema.extend({
  cursor: z.number().optional(),
})

export type CommentListInput = z.infer<typeof commentListInputSchema>

export const commentCreateInputSchema = commentTargetSchema
  .extend({
    id: z.string().min(1),
    media: mediaSchema,
    text: textSchema,
  })
  .refine(hasContent, { message: 'commentEmpty', path: ['text'] })

export type CommentCreateInput = z.infer<typeof commentCreateInputSchema>

export const commentUpdateInputSchema = commentTargetSchema
  .extend({
    id: z.string().min(1),
    media: mediaSchema,
    text: textSchema,
  })
  .refine(hasContent, { message: 'commentEmpty', path: ['text'] })

export type CommentUpdateInput = z.infer<typeof commentUpdateInputSchema>

export const commentDeleteInputSchema = commentTargetSchema.extend({
  id: z.string().min(1),
})

export type CommentDeleteInput = z.infer<typeof commentDeleteInputSchema>
