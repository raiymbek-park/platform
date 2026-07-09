import { createFileRoute } from '@tanstack/react-router'

import { CommentsScreen } from '@/features/comments'

const RouteComponent = () => {
  const { postId } = Route.useParams()
  return <CommentsScreen parent='post' parentId={postId} />
}

export const Route = createFileRoute('/posts/$postId/comments')({
  component: RouteComponent,
})
