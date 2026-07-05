import type { IssueCategory } from '@raiymbek-park/shared/validation-schemas'
import type { MediaItem } from '@/shared/media'

import { useLingui } from '@lingui/react/macro'

import { trpcClient } from '@/shared/api'
import { useIssueMutation } from '@/shared/issue'
import { uploadMediaItems } from '@/shared/media'

type UpdateIssueVariables = {
  category: IssueCategory
  description: string
  items: MediaItem[]
  title: string
  urgent: boolean
}

export const useUpdateIssue = (issueId: string) => {
  const { t } = useLingui()
  const { isPending, submit } = useIssueMutation<UpdateIssueVariables>(
    async ({ items, ...values }) => {
      const { failedCount, urls } = await uploadMediaItems(issueId, items)
      await trpcClient.issues.update.mutate({
        id: issueId,
        ...values,
        media: urls,
      })
      return failedCount
    },
    {
      error: t`Не удалось сохранить изменения. Попробуйте ещё раз.`,
      notFound: t`Заявка не найдена.`,
      partial: count => t`Изменения сохранены. Файлов не загрузилось: ${count}`,
      success: t`Изменения сохранены.`,
    },
  )

  return { isPending, updateIssue: submit }
}
