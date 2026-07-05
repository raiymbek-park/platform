import { createFileRoute } from '@tanstack/react-router'

import { IssueFormPage } from '@/pages/issue-form'

export const Route = createFileRoute('/issues/new')({
  component: IssueFormPage,
})
