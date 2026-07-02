import type { Issue } from '@raiymbek-park/api'
import type { IssueStatus } from '@raiymbek-park/shared/validation-schemas'

import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export type IssueView = Omit<Issue, 'author'> & {
  apartment: number
  authorName: string
  authorPhone: string
  block: number
}

const toIssueView = ({ author, ...issue }: Issue): IssueView => ({
  ...issue,
  apartment: author.apartment,
  authorName: author.name,
  authorPhone: author.phone,
  block: author.block,
})

export const useIssuesData = (status: IssueStatus) => {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.issues.list.queryOptions({ status }),
    select: issues => issues.map(toIssueView),
  })
}
