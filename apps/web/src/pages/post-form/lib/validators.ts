import type {
  PostCategory,
  PostKind,
} from '@raiymbek-park/shared/validation-schemas'

import {
  announcementCategories,
  offerCategories,
  POST_DESCRIPTION_MAX,
  POST_DESCRIPTION_MIN,
  POST_TITLE_MAX,
  POST_TITLE_MIN,
} from '@raiymbek-park/shared/validation-schemas'
import { z } from 'zod'

export const categoriesOf = (kind: PostKind): readonly PostCategory[] =>
  kind === 'offer' ? offerCategories : announcementCategories

export const postFormSchema = (kind: PostKind) =>
  z.object({
    category: z
      .custom<PostCategory | null>()
      .refine(
        value => value !== null && categoriesOf(kind).some(x => x === value),
      ),
    description: z
      .string()
      .trim()
      .min(POST_DESCRIPTION_MIN)
      .max(POST_DESCRIPTION_MAX),
    title: z.string().trim().min(POST_TITLE_MIN).max(POST_TITLE_MAX),
  })

export type PostFormValues = {
  category: PostCategory | null
  description: string
  title: string
}

export type PostFormSubmit = {
  category: PostCategory
  description: string
  title: string
}
