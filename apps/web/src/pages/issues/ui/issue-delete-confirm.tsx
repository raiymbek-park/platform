import { useLingui } from '@lingui/react/macro'
import { ConfirmPopup } from '@raiymbek-park/ui'

export type IssueDeleteConfirmProps = {
  isLoading?: boolean
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const IssueDeleteConfirm = ({
  isLoading,
  isOpen,
  onCancel,
  onConfirm,
}: IssueDeleteConfirmProps) => {
  const { t } = useLingui()

  return (
    <ConfirmPopup
      cancelLabel={t`Отмена`}
      confirmLabel={t`Удалить`}
      illustration={`${import.meta.env.BASE_URL}images/recycle-bin.png`}
      isLoading={isLoading}
      isOpen={isOpen}
      message={t`Это действие нельзя отменить. Заявка будет удалена безвозвратно.`}
      title={t`Удалить заявку?`}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
