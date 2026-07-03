import type { Issue } from '@raiymbek-park/api'
import type {
  IssueFilter,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'

import { useInfiniteQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { matchIssue } from './match-issue'
import { useStoreDeletedIssues } from './use-store-deleted-issues'
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

const statusOf = (key: readonly unknown[]): string | undefined => {
  const scan = (value: unknown): string | undefined => {
    if (typeof value !== 'object' || value === null) return undefined
    if ('status' in value && typeof value.status === 'string')
      return value.status
    return Object.values(value).map(scan).find(Boolean)
  }
  return scan(key)
}

type UseIssuesDataInput = {
  query: string
  search: string
  status: IssueFilter
}

export const useIssuesData = ({
  query,
  search,
  status,
}: UseIssuesDataInput) => {
  const trpc = useTRPC()
  const reactions = useStoreReactions(store => store.reactions)
  const deletedIds = useStoreDeletedIssues(store => store.deletedIds)
  const list = useInfiniteQuery(
    trpc.issues.list.infiniteQueryOptions(
      { search, status },
      {
        getNextPageParam: last => last.nextCursor ?? undefined,
        placeholderData: (previousData, previousQuery) =>
          previousQuery && statusOf(previousQuery.queryKey) === status
            ? previousData
            : undefined,
      },
    ),
  )

  const issues =
    list.data?.pages
      .flatMap(page => page.issues)
      .filter(issue => !deletedIds.has(issue.id))
      .map(issue => toView(issue, reactions[issue.id])) ?? []
  const isProjecting = query !== search || list.isPlaceholderData

  return {
    fetchNextPage: list.fetchNextPage,
    hasNextPage: list.hasNextPage,
    isError: list.isError,
    isFetching: list.isFetching,
    isFetchingNextPage: list.isFetchingNextPage,
    isPending: list.isPending,
    issues: isProjecting
      ? issues.filter(issue => matchIssue(issue, query))
      : issues,
    refetch: list.refetch,
  }
}
