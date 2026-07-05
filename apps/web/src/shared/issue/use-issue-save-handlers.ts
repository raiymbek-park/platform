import type { IssueFilter } from '@raiymbek-park/shared/validation-schemas'

import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { isNotFoundError, useTRPC } from '@/shared/api'
import { showToastMessage } from '@/shared/toast'

export type SaveMessages = {
  error: string
  notFound: string
  partial: (count: number) => string
  success: string
}

export const useIssueSaveHandlers = (messages: SaveMessages) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const listKey = trpc.issues.list.pathKey()
  const detailKey = trpc.issues.get.pathKey()

  return (filter: IssueFilter) => {
    const backToList = () =>
      navigate({ search: { status: filter }, to: '/issues' })

    return {
      onError: async (error: unknown) => {
        if (isNotFoundError(error)) {
          await backToList()
          showToastMessage({ kind: 'error', text: messages.notFound })
          return
        }
        showToastMessage({ kind: 'error', text: messages.error })
      },
      onSuccess: async (failedCount: number) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: listKey,
            refetchType: 'all',
          }),
          queryClient.invalidateQueries({
            queryKey: detailKey,
            refetchType: 'all',
          }),
        ])
        await backToList()
        showToastMessage(
          failedCount > 0
            ? { kind: 'info', text: messages.partial(failedCount) }
            : { kind: 'success', text: messages.success },
        )
      },
    }
  }
}
