import type { IssueCategory } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { randomId } from '@raiymbek-park/shared'

import { trpcClient } from '@/shared/api'
import { useIssueMutation } from '@/shared/issue'
import { uploadIssueMedia } from '@/shared/media'

type CreateIssueVariables = {
  category: IssueCategory
  description: string
  files: File[]
  title: string
  urgent: boolean
}

export const useCreateIssue = () => {
  const { t } = useLingui()
  const { isPending, submit } = useIssueMutation<CreateIssueVariables>(
    async ({ files, ...values }) => {
      const id = randomId()
      const { failedCount, urls } = await uploadIssueMedia(id, files)
      await trpcClient.issues.create.mutate({ id, ...values, media: urls })
      return failedCount
    },
    {
      error: t`Не удалось сохранить заявку. Попробуйте ещё раз.`,
      notFound: t`Заявка не найдена.`,
      partial: count => t`Заявка создана. Файлов не загрузилось: ${count}`,
      success: t`Заявка отправлена.`,
    },
  )

  return { createIssue: submit, isPending }
}
