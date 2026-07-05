import {
  classificationTagSchema,
  ISSUE_COMMENT_MAX,
  issueStatusSchema,
} from '@raiymbek-park/shared/validation-schemas'
import { z } from 'zod'

export const statusFormSchema = z.object({
  comment: z.string().trim().max(ISSUE_COMMENT_MAX),
  status: issueStatusSchema.nullable().refine(value => value !== null),
  tags: z.array(classificationTagSchema),
})

export type StatusFormValues = z.input<typeof statusFormSchema>
