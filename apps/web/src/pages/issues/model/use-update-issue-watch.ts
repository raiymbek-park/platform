import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { useStoreWatches } from './use-store-watches'

export const useUpdateIssueWatch = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const queryKey = trpc.issues.list.pathKey()
  const apply = useStoreWatches(store => store.apply)
  const clear = useStoreWatches(store => store.clear)
  const mutation = useMutation(trpc.issues.toggleWatch.mutationOptions())

  const toggleWatch = (issueId: string, current: boolean) => {
    const isWatching = !current
    apply(issueId, isWatching)
    mutation.mutate(
      { issueId },
      {
        onError: () => clear(issueId, isWatching),
        onSettled: async () => {
          await queryClient.invalidateQueries({ queryKey, refetchType: 'all' })
          clear(issueId, isWatching)
        },
      },
    )
  }

  return { toggleWatch }
}
