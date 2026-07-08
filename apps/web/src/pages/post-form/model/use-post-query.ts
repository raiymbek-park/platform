import { useLingui } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { isNotFoundError, useTRPC } from '@/shared/api'
import { showToastMessage } from '@/shared/toast'

export const usePostQuery = (postId: string) => {
  const { t } = useLingui()
  const trpc = useTRPC()
  const navigate = useNavigate()
  const { data, error, isPending, refetch } = useQuery(
    trpc.posts.get.queryOptions({ postId }, { retry: false }),
  )

  useEffect(() => {
    if (!isNotFoundError(error)) return
    navigate({ search: { tab: 'all' }, to: '/posts' })
    showToastMessage({ kind: 'error', text: t`Объявление не найдено.` })
  }, [error, navigate, t])

  return {
    isError: Boolean(error) && !isNotFoundError(error),
    isLoading: isPending,
    post: data,
    refetch,
  }
}
