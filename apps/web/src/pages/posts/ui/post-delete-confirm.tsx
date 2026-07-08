import { useLingui } from '@lingui/react/macro'
import { ConfirmPopup } from '@raiymbek-park/ui'

export type PostDeleteConfirmProps = {
  isLoading?: boolean
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const PostDeleteConfirm = ({
  isLoading,
  isOpen,
  onCancel,
  onConfirm,
}: PostDeleteConfirmProps) => {
  const { t } = useLingui()

  return (
    <ConfirmPopup
      cancelLabel={t`Отмена`}
      confirmLabel={t`Удалить`}
      illustration={`${import.meta.env.BASE_URL}images/recycle-bin.png`}
      isLoading={isLoading}
      isOpen={isOpen}
      message={t`Это действие нельзя отменить. Запись будет удалена безвозвратно.`}
      title={t`Удалить объявление?`}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
