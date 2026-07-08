import type { Issue } from '@raiymbek-park/api'
import type { ReactNode } from 'react'

import { useLingui } from '@lingui/react/macro'
import { ScreenHeader, Spinner } from '@raiymbek-park/ui'

import { IssueLoadError } from './issue-load-error'
import { useIssueQuery } from './use-issue-query'

type IssueLoaderProps = {
  children: (issue: Issue) => ReactNode
  issueId: string
}

export const IssueLoader = ({ children, issueId }: IssueLoaderProps) => {
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
  return children(issue)
}
