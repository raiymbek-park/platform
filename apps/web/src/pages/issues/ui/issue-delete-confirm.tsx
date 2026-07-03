import { useLingui } from '@lingui/react/macro'
import { Button, IconChip, PopupMenu } from '@raiymbek-park/ui'

import css from './issue-delete-confirm.module.scss'

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
    <PopupMenu isOpen={isOpen} onClose={onCancel}>
      <div className={css.confirm}>
        <IconChip glyph='trash-2' iconSize={30} size={72} tone='danger' />
        <h2 className={css.title}>{t`Удалить заявку?`}</h2>
        <p className={css.message}>
          {t`Это действие нельзя отменить. Заявка будет удалена безвозвратно.`}
        </p>
      </div>
      <div className={css.actions}>
        <Button isLoading={isLoading} variant='danger' onClick={onConfirm}>
          {t`Удалить`}
        </Button>
        <Button disabled={isLoading} variant='secondary' onClick={onCancel}>
          {t`Отмена`}
        </Button>
      </div>
    </PopupMenu>
  )
}
