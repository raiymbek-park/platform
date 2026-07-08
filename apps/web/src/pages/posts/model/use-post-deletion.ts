import { useLingui } from '@lingui/react/macro'
import { useState } from 'react'

import { showToastMessage } from '@/shared/toast'

import { useDeletePost } from './use-delete-post'

export const usePostDeletion = () => {
  const { t } = useLingui()
  const { deletePost } = useDeletePost()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const confirm = () => {
    if (!pendingId) return
    const id = pendingId
    setPendingId(null)
    deletePost(id, {
      onFailure: () =>
        showToastMessage({
          kind: 'error',
          text: t`Не удалось удалить объявление. Попробуйте ещё раз.`,
        }),
      onSuccess: () =>
        showToastMessage({ kind: 'success', text: t`Объявление удалено.` }),
    })
  }

  return {
    cancel: () => setPendingId(null),
    confirm,
    isConfirmOpen: pendingId !== null,
    request: setPendingId,
  }
}
