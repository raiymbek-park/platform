import { issueSearchSchema } from '@raiymbek-park/shared/validation-schemas'
import { createFileRoute } from '@tanstack/react-router'

import { IssuesPage } from '@/pages/issues'
import { ensureResidentSession } from '@/shared/session'

export const Route = createFileRoute('/issues')({
  beforeLoad: ensureResidentSession,
  component: IssuesPage,
  validateSearch: search => issueSearchSchema.parse(search),
})
