import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'

import { useInfiniteQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export const useCommentsData = ({ parent, parentId }: CommentTarget) => {
  const trpc = useTRPC()
  const list = useInfiniteQuery(
    trpc.comments.list.infiniteQueryOptions(
      { parent, parentId },
      { getNextPageParam: last => last.nextCursor ?? undefined },
    ),
  )

  const loaded = list.data?.pages.flatMap(page => page.comments) ?? []
  const comments = [...new Map(loaded.map(item => [item.id, item])).values()]

  return {
    comments,
    fetchNextPage: list.fetchNextPage,
    hasNextPage: list.hasNextPage,
    isError: list.isError,
    isFetchingNextPage: list.isFetchingNextPage,
    isPending: list.isPending,
    refetch: list.refetch,
  }
}
