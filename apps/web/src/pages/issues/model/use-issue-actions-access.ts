import type { IssueView } from './use-issues-data'

import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useIssueActionsAccess = () => {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.resident.me.queryOptions())
  const isAdministration = data?.role === 'administration'

  const canDelete = (issue: IssueView) =>
    issue.status === 'new' && (issue.isMine || isAdministration)

  return { canDelete }
}
