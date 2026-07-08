import { useLingui } from '@lingui/react/macro'
import { ScreenHeader, Spinner } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { usePostCreateAccess } from '../model/use-post-create-access'
import { CreatePostForm } from './create-post-form'
import { EditPostForm } from './edit-post-form'

const CreatePostGuard = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const { isPending, kinds } = usePostCreateAccess()

  useEffect(() => {
    if (!isPending && kinds.length === 0) {
      navigate({ search: { tab: 'all' }, to: '/posts' })
    }
  }, [isPending, kinds.length, navigate])

  if (isPending) {
    return (
      <>
        <ScreenHeader />
        <Spinner label={t`Загрузка…`} />
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
