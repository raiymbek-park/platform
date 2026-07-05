import { CreateIssueForm } from './create-issue-form'
import { EditIssueForm } from './edit-issue-form'

export type IssueFormPageProps = {
  issueId?: string
}

export const IssueFormPage = ({ issueId }: IssueFormPageProps) =>
  issueId ? <EditIssueForm issueId={issueId} /> : <CreateIssueForm />
