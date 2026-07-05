import { createFileRoute } from '@tanstack/react-router'

import { IssueFormPage } from '@/pages/issue-form'

const RouteComponent = () => {
  const { issueId } = Route.useParams()
  return <IssueFormPage issueId={issueId} />
}

export const Route = createFileRoute('/issues/edit/$issueId')({
  component: RouteComponent,
})
