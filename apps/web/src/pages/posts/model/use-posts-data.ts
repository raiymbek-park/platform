import type { Post } from '@raiymbek-park/api'
import type {
  PostTab,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'

import { matchKeywords } from '@raiymbek-park/shared'
import { useInfiniteQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { useStoreDeletedPosts } from './use-store-deleted-posts'
import { useStoreReactions } from './use-store-reactions'

export type PostView = Omit<Post, 'author'> & {
  apartment: number
  authorName: string
  authorPhone?: string
  block: number
}

const toView = (
  { author, ...post }: Post,
  reaction: ReactionKind | null | undefined,
): PostView => {
  const view = {
    ...post,
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
          post.dislikeCount +
          (reaction === 'dislike' ? 1 : 0) -
          (post.myReaction === 'dislike' ? 1 : 0),
        likeCount:
          post.likeCount +
          (reaction === 'like' ? 1 : 0) -
          (post.myReaction === 'like' ? 1 : 0),
        myReaction: reaction,
      }
}

const tabOf = (key: readonly unknown[]): string | undefined => {
  const scan = (value: unknown): string | undefined => {
    if (typeof value !== 'object' || value === null) return undefined
    if ('tab' in value && typeof value.tab === 'string') return value.tab
    return Object.values(value).map(scan).find(Boolean)
  }
  return scan(key)
}

type UsePostsDataInput = {
  query: string
  search: string
  tab: PostTab
}

export const usePostsData = ({ query, search, tab }: UsePostsDataInput) => {
  const trpc = useTRPC()
  const reactions = useStoreReactions(store => store.reactions)
  const deletedIds = useStoreDeletedPosts(store => store.deletedIds)
  const list = useInfiniteQuery(
    trpc.posts.list.infiniteQueryOptions(
      { search, tab },
      {
        getNextPageParam: last => last.nextCursor ?? undefined,
        placeholderData: (previousData, previousQuery) =>
          previousQuery && tabOf(previousQuery.queryKey) === tab
            ? previousData
            : undefined,
      },
    ),
  )

  const loaded = list.data?.pages.flatMap(page => page.posts) ?? []
  const posts = [...new Map(loaded.map(post => [post.id, post])).values()]
    .filter(post => !deletedIds.has(post.id))
    .map(post => toView(post, reactions[post.id]))
  const isProjecting = query !== search || list.isPlaceholderData

  return {
    fetchNextPage: list.fetchNextPage,
    hasNextPage: list.hasNextPage,
    isError: list.isError,
    isFetching: list.isFetching,
    isFetchingNextPage: list.isFetchingNextPage,
    isPending: list.isPending,
    posts: isProjecting
      ? posts.filter(post => matchKeywords(post.keywords, query))
      : posts,
    refetch: list.refetch,
  }
}
