import { useLingui } from '@lingui/react/macro'
import { useState } from 'react'

import { showToastMessage } from '@/shared/toast'

import { useDeleteIssue } from './use-delete-issue'
import { useIssueActionsAccess } from './use-issue-actions-access'

export const useIssueDeletion = () => {
  const { t } = useLingui()
  const { canDelete } = useIssueActionsAccess()
  const { deleteIssue } = useDeleteIssue()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const confirm = () => {
    if (!pendingId) return
    const id = pendingId
    setPendingId(null)
    deleteIssue(id, {
      onFailure: () =>
        showToastMessage({
          kind: 'error',
          text: t`Не удалось удалить заявку. Попробуйте ещё раз.`,
        }),
    })
  }

  return {
    canDelete,
    cancel: () => setPendingId(null),
    confirm,
    isConfirmOpen: pendingId !== null,
    request: setPendingId,
  }
}
