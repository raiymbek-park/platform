import { createFileRoute } from '@tanstack/react-router'

import { CommentsPage } from '@/pages/comments'

const RouteComponent = () => {
  const { issueId } = Route.useParams()
  return <CommentsPage parent='issue' parentId={issueId} />
}

export const Route = createFileRoute('/issues/$issueId/comments')({
  component: RouteComponent,
})
