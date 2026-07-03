import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { useStoreDeletedIssues } from './use-store-deleted-issues'

type DeleteOptions = {
  onFailure: () => void
}

export const useDeleteIssue = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const listKey = trpc.issues.list.pathKey()
  const remove = useStoreDeletedIssues(store => store.remove)
  const restore = useStoreDeletedIssues(store => store.restore)
  const mutation = useMutation(trpc.issues.delete.mutationOptions())

  const deleteIssue = (issueId: string, { onFailure }: DeleteOptions) => {
    remove(issueId)
    mutation.mutate(
      { issueId },
      {
        onError: error => {
          if (error.data?.code === 'NOT_FOUND') return
          restore(issueId)
          onFailure()
        },
        onSettled: async () => {
          await queryClient.invalidateQueries({
            queryKey: listKey,
            refetchType: 'all',
          })
          restore(issueId)
        },
      },
    )
  }

  return { deleteIssue }
}
