import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { usePostCreateAccess } from '../model/use-post-create-access'
import { CreatePostForm } from './create-post-form'
import { EditPostForm } from './edit-post-form'
import { PendingScreen, RetryScreen } from './query-screens'

const CreatePostGuard = () => {
  const navigate = useNavigate()
  const { isError, isPending, kinds, refetch } = usePostCreateAccess()

  useEffect(() => {
    if (!isPending && !isError && kinds.length === 0) {
      navigate({ search: { tab: 'all' }, to: '/posts' })
    }
  }, [isError, isPending, kinds.length, navigate])

  if (isPending) return <PendingScreen />
  if (isError) return <RetryScreen onRetry={() => refetch()} />

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
