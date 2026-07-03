import { z } from 'zod'

export const issueStatuses = [
  'new',
  'in-progress',
  'planned',
  'blocked',
  'resident-review',
  'done',
  'rejected',
] as const

export type IssueStatus = (typeof issueStatuses)[number]

export const issueFilters = ['all', ...issueStatuses] as const

export type IssueFilter = (typeof issueFilters)[number]

export const issueCategories = [
  'repair',
  'replacement',
  'complaint',
  'violation',
  'other',
] as const

export type IssueCategory = (typeof issueCategories)[number]

export const classificationTags = [
  'warranty',
  'needs-clarification',
  'duplicate',
] as const

export type ClassificationTag = (typeof classificationTags)[number]

export const permissionRoles = [
  'viewer',
  'resident',
  'owner',
  'manager',
  'administration',
] as const

export type PermissionRole = (typeof permissionRoles)[number]

export const reactionKinds = ['like', 'dislike'] as const

export type ReactionKind = (typeof reactionKinds)[number]

export const issueStatusSchema = z.enum(issueStatuses)
export const issueFilterSchema = z.enum(issueFilters)
export const issueCategorySchema = z.enum(issueCategories)
export const classificationTagSchema = z.enum(classificationTags)
export const reactionKindSchema = z.enum(reactionKinds)

export const DEFAULT_ISSUE_STATUS: IssueStatus = 'new'
export const DEFAULT_PERMISSION_ROLE: PermissionRole = 'resident'

export const resolveRole = (raw: unknown): PermissionRole =>
  permissionRoles.find(role => role === raw) ?? DEFAULT_PERMISSION_ROLE

export const ISSUE_PAGE_SIZE = 20

export const issueListInputSchema = z.object({
  cursor: z.number().optional(),
  search: z.string().optional(),
  status: issueFilterSchema.default(DEFAULT_ISSUE_STATUS),
})

export type IssueListInput = z.infer<typeof issueListInputSchema>

export const issueSearchSchema = z.object({
  status: issueFilterSchema.catch(DEFAULT_ISSUE_STATUS),
})

export type IssueSearch = z.infer<typeof issueSearchSchema>

export const reactionInputSchema = z.object({
  issueId: z.string().min(1),
  kind: reactionKindSchema,
})

export type ReactionInput = z.infer<typeof reactionInputSchema>

export const MEDIA_MAX_ITEMS = 10
export const MEDIA_MAX_BYTES = 200 * 1024 * 1024

export const ISSUE_TITLE_MIN = 3
export const ISSUE_TITLE_MAX = 80
export const ISSUE_DESCRIPTION_MIN = 10
export const ISSUE_DESCRIPTION_MAX = 1000

export const issueCreateInputSchema = z.object({
  category: issueCategorySchema,
  description: z
    .string()
    .trim()
    .min(ISSUE_DESCRIPTION_MIN)
    .max(ISSUE_DESCRIPTION_MAX),
  media: z.array(z.string()).max(MEDIA_MAX_ITEMS).default([]),
  title: z.string().trim().min(ISSUE_TITLE_MIN).max(ISSUE_TITLE_MAX),
  urgent: z.boolean().default(false),
})

export type IssueCreateInput = z.infer<typeof issueCreateInputSchema>

export const issueDeleteInputSchema = z.object({
  issueId: z.string().min(1),
})

export type IssueDeleteInput = z.infer<typeof issueDeleteInputSchema>
