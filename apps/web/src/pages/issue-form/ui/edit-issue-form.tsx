import type { Issue } from '@raiymbek-park/api'

import { useLingui } from '@lingui/react/macro'
import { ScreenHeader, Spinner } from '@raiymbek-park/ui'

import { useIssueQuery } from '@/shared/issue'
import { useMediaPicker } from '@/shared/media'

import { useUpdateIssue } from '../model/use-update-issue'
import { IssueFormFields } from './issue-form-fields'

const EditIssueFormReady = ({ issue }: { issue: Issue }) => {
  const { t } = useLingui()
  const media = useMediaPicker({ initialUrls: issue.media })
  const { isPending, updateIssue } = useUpdateIssue(issue.id)

  return (
    <IssueFormFields
      defaultValues={{
        category: issue.category,
        description: issue.description,
        title: issue.title,
        urgent: issue.urgent,
      }}
      isPending={isPending}
      media={media}
      submitIcon='check'
      submitLabel={t`Сохранить`}
      subtitle={t`Измените заявку и сохраните изменения.`}
      title={t`Редактировать заявку`}
      onSubmit={values => updateIssue({ ...values, items: media.items })}
    />
  )
}

export const EditIssueForm = ({ issueId }: { issueId: string }) => {
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
  return <EditIssueFormReady issue={issue} />
}
