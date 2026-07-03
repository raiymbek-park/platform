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
