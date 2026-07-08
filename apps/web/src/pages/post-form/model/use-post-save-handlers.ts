import type { PostTab } from '@raiymbek-park/shared/validation-schemas'

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

export const usePostSaveHandlers = (messages: SaveMessages) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const listKey = trpc.posts.list.pathKey()
  const detailKey = trpc.posts.get.pathKey()

  return (tab: PostTab) => {
    const backToFeed = () => navigate({ search: { tab }, to: '/posts' })

    return {
      onError: async (error: unknown) => {
        if (isNotFoundError(error)) {
          await backToFeed()
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
        await backToFeed()
        showToastMessage(
          failedCount > 0
            ? { kind: 'info', text: messages.partial(failedCount) }
            : { kind: 'success', text: messages.success },
        )
      },
    }
  }
}
