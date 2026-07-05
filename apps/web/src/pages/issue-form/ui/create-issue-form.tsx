import type { IssueFormValues } from '../lib/validators'

import { useLingui } from '@lingui/react/macro'

import { useMediaPicker } from '@/shared/media'

import { useCreateIssue } from '../model/use-create-issue'
import { IssueFormFields } from './issue-form-fields'

const emptyDefaults: IssueFormValues = {
  category: null,
  description: '',
  title: '',
  urgent: false,
}

export const CreateIssueForm = () => {
  const { t } = useLingui()
  const media = useMediaPicker()
  const { createIssue, isPending } = useCreateIssue()

  return (
    <IssueFormFields
      defaultValues={emptyDefaults}
      isPending={isPending}
      media={media}
      submitIcon='send-horizontal'
      submitLabel={t`Отправить`}
      subtitle={t`Опишите проблему или вопрос, который вы хотите направить управляющей компании или жителям нашего ЖК.`}
      title={t`Новая заявка`}
      onSubmit={values => createIssue({ ...values, files: media.files })}
    />
  )
}
