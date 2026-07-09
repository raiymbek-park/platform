import { createFileRoute } from '@tanstack/react-router'

import { CommentsPage } from '@/pages/comments'

const RouteComponent = () => {
  const { postId } = Route.useParams()
  return <CommentsPage parent='post' parentId={postId} />
}

export const Route = createFileRoute('/posts/$postId/comments')({
  component: RouteComponent,
})
