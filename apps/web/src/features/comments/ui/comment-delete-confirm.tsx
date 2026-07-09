import { useLingui } from '@lingui/react/macro'
import { ConfirmPopup } from '@raiymbek-park/ui'

export type CommentDeleteConfirmProps = {
  isLoading?: boolean
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const CommentDeleteConfirm = ({
  isLoading,
  isOpen,
  onCancel,
  onConfirm,
}: CommentDeleteConfirmProps) => {
  const { t } = useLingui()

  return (
    <ConfirmPopup
      cancelLabel={t`Отмена`}
      confirmLabel={t`Удалить`}
      illustration={`${import.meta.env.BASE_URL}images/recycle-bin.png`}
      isLoading={isLoading}
      isOpen={isOpen}
      message={t`Это действие нельзя отменить. Сообщение будет удалено безвозвратно.`}
      title={t`Удалить сообщение?`}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
