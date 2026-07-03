import type { ReactionKind } from '@raiymbek-park/shared/validation-schemas'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { useStoreReactions } from './use-store-reactions'

export const useUpdateIssueReaction = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const queryKey = trpc.issues.list.pathKey()
  const apply = useStoreReactions(store => store.apply)
  const clear = useStoreReactions(store => store.clear)
  const mutation = useMutation(trpc.issues.react.mutationOptions())

  const react = (
    issueId: string,
    kind: ReactionKind,
    current: ReactionKind | null,
  ) => {
    const reaction = current === kind ? null : kind
    apply(issueId, reaction)
    mutation.mutate(
      { issueId, kind },
      {
        onError: () => clear(issueId, reaction),
        onSettled: async () => {
          await queryClient.invalidateQueries({ queryKey, refetchType: 'all' })
          clear(issueId, reaction)
        },
      },
    )
  }

  return { react }
}
