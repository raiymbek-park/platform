import type { Issue } from '@raiymbek-park/api'
import type {
  IssueFilter,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'

import { useInfiniteQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { useStoreReactions } from './use-store-reactions'

export type IssueView = Omit<Issue, 'author'> & {
  apartment: number
  authorName: string
  authorPhone?: string
  block: number
}

const toView = (
  { author, ...issue }: Issue,
  reaction: ReactionKind | null | undefined,
): IssueView => {
  const view = {
    ...issue,
    apartment: author.apartment,
    authorName: author.name,
    authorPhone: author.phone,
    block: author.block,
  }
  return reaction === undefined
    ? view
    : {
        ...view,
        dislikeCount:
          issue.dislikeCount +
          (reaction === 'dislike' ? 1 : 0) -
          (issue.myReaction === 'dislike' ? 1 : 0),
        likeCount:
          issue.likeCount +
          (reaction === 'like' ? 1 : 0) -
          (issue.myReaction === 'like' ? 1 : 0),
        myReaction: reaction,
      }
}

export const useIssuesData = (status: IssueFilter) => {
  const trpc = useTRPC()
  const reactions = useStoreReactions(store => store.reactions)
  const query = useInfiniteQuery(
    trpc.issues.list.infiniteQueryOptions(
      { status },
      { getNextPageParam: last => last.nextCursor ?? undefined },
    ),
  )

  return {
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    isPending: query.isPending,
    issues:
      query.data?.pages
        .flatMap(page => page.issues)
        .map(issue => toView(issue, reactions[issue.id])) ?? [],
    refetch: query.refetch,
  }
}
