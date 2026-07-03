import { useLingui } from '@lingui/react/macro'
import { useState } from 'react'

import { useDeleteIssue } from './use-delete-issue'
import { useIssueActionsAccess } from './use-issue-actions-access'

export const useIssueDeletion = () => {
  const { t } = useLingui()
  const { canDelete } = useIssueActionsAccess()
  const { deleteIssue } = useDeleteIssue()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const confirm = () => {
    if (!pendingId) return
    const id = pendingId
    setPendingId(null)
    deleteIssue(id, {
      onFailure: () =>
        setError(t`Не удалось удалить заявку. Попробуйте ещё раз.`),
    })
  }

  return {
    canDelete,
    cancel: () => setPendingId(null),
    confirm,
    error,
    isConfirmOpen: pendingId !== null,
    request: setPendingId,
  }
}
