import { IssueLoader } from '@/shared/issue'

import { StatusForm } from './status-form'

export type IssueStatusPageProps = {
  issueId: string
}

export const IssueStatusPage = ({ issueId }: IssueStatusPageProps) => (
  <IssueLoader issueId={issueId}>
    {issue => <StatusForm issue={issue} />}
  </IssueLoader>
)
