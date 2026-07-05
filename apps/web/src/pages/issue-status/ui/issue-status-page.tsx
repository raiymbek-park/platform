import { useLingui } from '@lingui/react/macro'
import { ScreenHeader, Spinner } from '@raiymbek-park/ui'

import { IssueLoadError, useIssueQuery } from '@/shared/issue'

import { StatusForm } from './status-form'

export type IssueStatusPageProps = {
  issueId: string
}

export const IssueStatusPage = ({ issueId }: IssueStatusPageProps) => {
  const { t } = useLingui()
  const { isError, isLoading, issue, refetch } = useIssueQuery(issueId)

  if (isLoading) {
    return (
      <>
        <ScreenHeader />
        <Spinner label={t`Загрузка…`} />
      </>
    )
  }
  if (isError) return <IssueLoadError onRetry={refetch} />
  if (!issue) return null
  return <StatusForm issue={issue} />
}
