import { createFileRoute } from '@tanstack/react-router'

import { IssuesNewPage } from '@/pages/issues-new'
import { ensureResidentSession } from '@/shared/session'

export const Route = createFileRoute('/issues_/new')({
  beforeLoad: ensureResidentSession,
  component: IssuesNewPage,
})
