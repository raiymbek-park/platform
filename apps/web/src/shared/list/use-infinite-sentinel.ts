import { useIntersectionObserver } from '@/shared/lib'

type SentinelOptions = {
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
}

export const useInfiniteSentinel = ({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: SentinelOptions) =>
  useIntersectionObserver<HTMLDivElement>({
    enabled: hasNextPage,
    onChange: isIntersecting => {
      if (isIntersecting && !isFetchingNextPage) fetchNextPage()
    },
  })
