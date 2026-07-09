import { createFileRoute } from '@tanstack/react-router'

import { CommentsScreen } from '@/features/comments'

const RouteComponent = () => {
  const { issueId } = Route.useParams()
  return <CommentsScreen parent='issue' parentId={issueId} />
}

export const Route = createFileRoute('/issues/$issueId/comments')({
  component: RouteComponent,
})
