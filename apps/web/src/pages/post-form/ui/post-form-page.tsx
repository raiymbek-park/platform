import { useLingui } from '@lingui/react/macro'
import { Button, ScreenHeader, Spinner } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { usePostCreateAccess } from '../model/use-post-create-access'
import { CreatePostForm } from './create-post-form'
import { EditPostForm } from './edit-post-form'
import css from './post-loader.module.scss'

const CreatePostGuard = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const { isError, isPending, kinds, refetch } = usePostCreateAccess()

  useEffect(() => {
    if (!isPending && !isError && kinds.length === 0) {
      navigate({ search: { tab: 'all' }, to: '/posts' })
    }
  }, [isError, isPending, kinds.length, navigate])

  if (isPending) {
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

  const initialKind = kinds[0]
  if (!initialKind) return null

  return (
    <CreatePostForm
      canSwitchKind={kinds.length > 1}
      initialKind={initialKind}
    />
  )
}

export type PostFormPageProps = {
  postId?: string
}

export const PostFormPage = ({ postId }: PostFormPageProps) =>
  postId ? <EditPostForm postId={postId} /> : <CreatePostGuard />
