import { createFileRoute } from '@tanstack/react-router'

import { IssueStatusPage } from '@/pages/issue-status'

const RouteComponent = () => {
  const { issueId } = Route.useParams()
  return <IssueStatusPage issueId={issueId} />
}

export const Route = createFileRoute('/issues/status/$issueId')({
  component: RouteComponent,
})
