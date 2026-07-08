import type { ReactionKind } from '@raiymbek-park/shared/validation-schemas'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { useStoreReactions } from './use-store-reactions'

export const useUpdatePostReaction = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const queryKey = trpc.posts.list.pathKey()
  const apply = useStoreReactions(store => store.apply)
  const clear = useStoreReactions(store => store.clear)
  const mutation = useMutation(trpc.posts.react.mutationOptions())

  const react = (
    postId: string,
    kind: ReactionKind,
    current: ReactionKind | null,
  ) => {
    const reaction = current === kind ? null : kind
    apply(postId, reaction)
    mutation.mutate(
      { kind, postId },
      {
        onError: () => clear(postId, reaction),
        onSettled: async () => {
          await queryClient.invalidateQueries({ queryKey, refetchType: 'all' })
          clear(postId, reaction)
        },
      },
    )
  }

  return { react }
}
