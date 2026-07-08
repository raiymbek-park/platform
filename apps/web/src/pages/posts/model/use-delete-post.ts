import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { useStoreDeletedPosts } from './use-store-deleted-posts'

type DeleteOptions = {
  onFailure: () => void
  onSuccess: () => void
}

export const useDeletePost = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const listKey = trpc.posts.list.pathKey()
  const remove = useStoreDeletedPosts(store => store.remove)
  const restore = useStoreDeletedPosts(store => store.restore)
  const mutation = useMutation(trpc.posts.delete.mutationOptions())

  const deletePost = (
    postId: string,
    { onFailure, onSuccess }: DeleteOptions,
  ) => {
    remove(postId)
    mutation.mutate(
      { postId },
      {
        onError: error => {
          if (error.data?.code === 'NOT_FOUND') {
            onSuccess()
            return
          }
          restore(postId)
          onFailure()
        },
        onSuccess,
        onSettled: async () => {
          await queryClient.invalidateQueries({
            queryKey: listKey,
            refetchType: 'all',
          })
          restore(postId)
        },
      },
    )
  }

  return { deletePost }
}
