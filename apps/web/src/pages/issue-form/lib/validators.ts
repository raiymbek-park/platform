import type { IssueCategory } from '@raiymbek-park/shared/validation-schemas'

import {
  ISSUE_DESCRIPTION_MAX,
  ISSUE_DESCRIPTION_MIN,
  ISSUE_TITLE_MAX,
  ISSUE_TITLE_MIN,
  issueCategorySchema,
} from '@raiymbek-park/shared/validation-schemas'
import { z } from 'zod'

export const issueFormSchema = z.object({
  category: issueCategorySchema.nullable().refine(value => value !== null),
  description: z
    .string()
    .trim()
    .min(ISSUE_DESCRIPTION_MIN)
    .max(ISSUE_DESCRIPTION_MAX),
  title: z.string().trim().min(ISSUE_TITLE_MIN).max(ISSUE_TITLE_MAX),
  urgent: z.boolean(),
})

export type IssueFormValues = z.input<typeof issueFormSchema>

export type IssueFormSubmit = {
  category: IssueCategory
  description: string
  title: string
  urgent: boolean
}
