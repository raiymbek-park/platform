import type { Post } from '@raiymbek-park/api'
import type { ReactNode } from 'react'

import { useLingui } from '@lingui/react/macro'
import { useEffect } from 'react'

import { showToastMessage } from '@/shared/toast'

import { usePostQuery } from '../model/use-post-query'
import { PendingScreen, RetryScreen } from './query-screens'

type PostLoaderProps = {
  children: (post: Post) => ReactNode
  postId: string
}

export const PostLoader = ({ children, postId }: PostLoaderProps) => {
  const { t } = useLingui()
  const { isError, isLoading, post, refetch } = usePostQuery(postId)

  useEffect(() => {
    if (isError) {
      showToastMessage({
        kind: 'error',
        text: t`Не удалось загрузить объявление`,
      })
    }
  }, [isError, t])

  if (isLoading) return <PendingScreen />
  if (isError) return <RetryScreen onRetry={() => refetch()} />
  if (!post) return null
  return children(post)
}
