import type {
  ClassificationTag,
  IssueStatus,
} from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'

import { trpcClient } from '@/shared/api'
import { useIssueMutation } from '@/shared/issue'
import { uploadIssueMedia } from '@/shared/media'

type ChangeStatusVariables = {
  comment: string
  files: File[]
  status: IssueStatus
  tags: ClassificationTag[]
}

export const useChangeStatus = (issueId: string) => {
  const { t } = useLingui()
  const { isPending, submit } = useIssueMutation<ChangeStatusVariables>(
    async ({ files, ...values }) => {
      const { failedCount, urls } = await uploadIssueMedia(issueId, files)
      await trpcClient.issues.changeStatus.mutate({
        issueId,
        ...values,
        media: urls,
      })
      return failedCount
    },
    {
      error: t`Не удалось сменить статус. Попробуйте ещё раз.`,
      notFound: t`Заявка не найдена.`,
      partial: count => t`Статус обновлён. Файлов не загрузилось: ${count}`,
      success: t`Статус обновлён.`,
    },
    variables => variables.status,
  )

  return { changeStatus: submit, isPending }
}
