import type { Issue } from '@raiymbek-park/api'
import type {
  IssueStatus,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { useTRPC } from '@/shared/api'

const applyReaction = (issue: Issue, kind: ReactionKind): Issue => {
  const next = issue.myReaction === kind ? null : kind
  return {
    ...issue,
    dislikeCount:
      issue.dislikeCount +
      (next === 'dislike' ? 1 : 0) -
      (issue.myReaction === 'dislike' ? 1 : 0),
    likeCount:
      issue.likeCount +
      (next === 'like' ? 1 : 0) -
      (issue.myReaction === 'like' ? 1 : 0),
    myReaction: next,
  }
}

export const useUpdateIssueReaction = (status: IssueStatus) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const { queryKey } = trpc.issues.list.queryOptions({ status })

  const releaseId = (issueId: string) =>
    setPendingIds(ids => {
      const next = new Set(ids)
      next.delete(issueId)
      return next
    })

  const mutation = useMutation(
    trpc.issues.react.mutationOptions({
      onMutate: async ({ issueId, kind }) => {
        await queryClient.cancelQueries({ queryKey })
        const previous = queryClient.getQueryData<Issue[]>(queryKey)
        queryClient.setQueryData<Issue[]>(queryKey, issues =>
          issues?.map(issue =>
            issue.id === issueId ? applyReaction(issue, kind) : issue,
          ),
        )
        return { previous }
      },
      onError: (_error, _input, context) => {
        if (context?.previous) {
          queryClient.setQueryData(queryKey, context.previous)
        }
      },
      onSettled: (_data, _error, { issueId }) => {
        releaseId(issueId)
        return queryClient.invalidateQueries({ queryKey })
      },
    }),
  )

  const react = (issueId: string, kind: ReactionKind) => {
    if (pendingIds.has(issueId)) return
    setPendingIds(ids => new Set(ids).add(issueId))
    mutation.mutate({ issueId, kind })
  }

  return { isReacting: (issueId: string) => pendingIds.has(issueId), react }
}
