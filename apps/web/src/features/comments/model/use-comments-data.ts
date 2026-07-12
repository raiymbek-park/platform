import type { CommentTarget } from '@raiymbek-park/shared/validation-schemas'

import { useInfiniteQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { useStoreDeletedComments } from './use-store-deleted-comments'
import { useStoreEditedComments } from './use-store-edited-comments'

export const useCommentsData = ({ parent, parentId }: CommentTarget) => {
  const trpc = useTRPC()
  const deletedIds = useStoreDeletedComments(store => store.deletedIds)
  const editedById = useStoreEditedComments(store => store.edited)
  const list = useInfiniteQuery(
    trpc.comments.list.infiniteQueryOptions(
      { parent, parentId },
      { getNextPageParam: last => last.nextCursor ?? undefined },
    ),
  )

  const loaded = list.data?.pages.flatMap(page => page.comments) ?? []
  const comments = [...new Map(loaded.map(item => [item.id, item])).values()]
    .filter(comment => !deletedIds.has(comment.id))
    .map(comment => {
      const edit = editedById[comment.id]
      return edit
        ? {
            ...comment,
            editedAt: edit.editedAt,
            media: edit.media,
            text: edit.text,
          }
        : comment
    })

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
