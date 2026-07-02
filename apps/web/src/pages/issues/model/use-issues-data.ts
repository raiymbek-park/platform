import type { Issue } from '@raiymbek-park/api'
import type {
  ClassificationTag,
  IssueCategory,
  IssueStatus,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'

import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export type IssueView = {
  apartment: number
  authorName: string
  block: number
  category: IssueCategory
  description: string
  dislikeCount: number
  id: string
  likeCount: number
  myReaction: ReactionKind | null
  number: number
  status: IssueStatus
  tags: ClassificationTag[]
  title: string
  urgent: boolean
}

const toIssueView = (issue: Issue): IssueView => ({
  apartment: issue.author.apartment,
  authorName: issue.author.name,
  block: issue.author.block,
  category: issue.category,
  description: issue.description,
  dislikeCount: issue.dislikeCount,
  id: issue.id,
  likeCount: issue.likeCount,
  myReaction: issue.myReaction,
  number: issue.number,
  status: issue.status,
  tags: issue.tags,
  title: issue.title,
  urgent: issue.urgent,
})

export const useIssuesData = (status: IssueStatus) => {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.issues.list.queryOptions({ status }),
    select: issues => issues.map(toIssueView),
  })
}
