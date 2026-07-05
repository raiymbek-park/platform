import { ScreenHeader, Spinner } from '@raiymbek-park/ui'

import { useIssueQuery } from '@/shared/issue'

import { StatusForm } from './status-form'

export type IssueStatusPageProps = {
  issueId: string
}

export const IssueStatusPage = ({ issueId }: IssueStatusPageProps) => {
  const { isLoading, issue } = useIssueQuery(issueId)

  if (isLoading) {
    return (
      <>
        <ScreenHeader />
        <Spinner />
      </>
    )
  }
  if (!issue) return null
  return <StatusForm issue={issue} />
}
