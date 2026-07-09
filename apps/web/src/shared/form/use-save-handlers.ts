import type { QueryKey } from '@tanstack/react-query'

import { useQueryClient } from '@tanstack/react-query'

import { isNotFoundError } from '@/shared/api'
import { showToastMessage } from '@/shared/toast'

export type SaveMessages = {
  error: string
  notFound: string
  partial: (count: number) => string
  success: string
}

type SaveHandlersOptions = {
  detailKey: QueryKey
  listKey: QueryKey
  messages: SaveMessages
}

export const useSaveHandlers = ({
  detailKey,
  listKey,
  messages,
}: SaveHandlersOptions) => {
  const queryClient = useQueryClient()

  return (back: () => Promise<void>) => ({
    onError: async (error: unknown) => {
      if (isNotFoundError(error)) {
        await back()
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
      await back()
      showToastMessage(
        failedCount > 0
          ? { kind: 'info', text: messages.partial(failedCount) }
          : { kind: 'success', text: messages.success },
      )
    },
  })
}
