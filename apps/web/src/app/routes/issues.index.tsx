import { issueSearchSchema } from '@raiymbek-park/shared/validation-schemas'
import { createFileRoute } from '@tanstack/react-router'

import { IssuesPage } from '@/pages/issues'

export const Route = createFileRoute('/issues/')({
  component: IssuesPage,
  validateSearch: search => issueSearchSchema.parse(search),
})
