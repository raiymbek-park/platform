import type { Post } from '@raiymbek-park/api'
import type { ReactNode } from 'react'

import { useLingui } from '@lingui/react/macro'
import { Button, ScreenHeader, Spinner } from '@raiymbek-park/ui'
import { useEffect } from 'react'

import { showToastMessage } from '@/shared/toast'

import { usePostQuery } from '../model/use-post-query'
import css from './post-loader.module.scss'

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

  if (isLoading) {
    return (
      <>
        <ScreenHeader />
        <Spinner label={t`Загрузка…`} />
      </>
    )
  }
  if (isError) {
    return (
      <>
        <ScreenHeader />
        <div className={css.state}>
          <Button
            icon='refresh-cw'
            variant='secondary'
            onClick={() => refetch()}
          >
            {t`Повторить`}
          </Button>
        </div>
      </>
    )
  }
  if (!post) return null
  return children(post)
}
