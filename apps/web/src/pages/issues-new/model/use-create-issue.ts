import type { IssueCategory } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { randomId } from '@raiymbek-park/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { trpcClient, useTRPC } from '@/shared/api'
import { showToastMessage } from '@/shared/toast'

import { uploadIssueMedia } from './upload-media'

type CreateIssueVariables = {
  category: IssueCategory
  description: string
  files: File[]
  title: string
  urgent: boolean
}

export const useCreateIssue = () => {
  const { t } = useLingui()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const listKey = trpc.issues.list.pathKey()
  const mutation = useMutation({
    mutationFn: async ({ files, ...values }: CreateIssueVariables) => {
      const id = randomId()
      const { failedCount, urls } = await uploadIssueMedia(id, files)
      await trpcClient.issues.create.mutate({ id, ...values, media: urls })
      return failedCount
    },
  })

  const createIssue = (variables: CreateIssueVariables) => {
    mutation.mutate(variables, {
      onError: () =>
        showToastMessage({
          kind: 'error',
          text: t`Не удалось сохранить заявку. Попробуйте ещё раз.`,
        }),
      onSuccess: async failedCount => {
        await queryClient.invalidateQueries({
          queryKey: listKey,
          refetchType: 'all',
        })
        await navigate({ search: { status: 'new' }, to: '/issues' })
        showToastMessage(
          failedCount > 0
            ? {
                kind: 'info',
                text: t`Заявка создана. Файлов не загрузилось: ${failedCount}`,
              }
            : { kind: 'success', text: t`Заявка отправлена.` },
        )
      },
    })
  }

  return { createIssue, isPending: mutation.isPending }
}
