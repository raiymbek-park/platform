import type { IssueFilter } from '@raiymbek-park/shared/validation-schemas'
import type { SaveMessages } from '@/shared/form'

import { useNavigate } from '@tanstack/react-router'

import { useTRPC } from '@/shared/api'
import { useSaveHandlers } from '@/shared/form'

export type { SaveMessages }

export const useIssueSaveHandlers = (messages: SaveMessages) => {
  const trpc = useTRPC()
  const navigate = useNavigate()
  const buildHandlers = useSaveHandlers({
    detailKey: trpc.issues.get.pathKey(),
    listKey: trpc.issues.list.pathKey(),
    messages,
  })

  return (filter: IssueFilter) =>
    buildHandlers(() => navigate({ search: { status: filter }, to: '/issues' }))
}
