import { useLingui } from '@lingui/react/macro'
import { Button, PopupMenu } from '@raiymbek-park/ui'

import css from './comment-actions-sheet.module.scss'

export type CommentActionsSheetProps = {
  canEdit: boolean
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  onEdit: () => void
}

export const CommentActionsSheet = ({
  canEdit,
  isOpen,
  onClose,
  onDelete,
  onEdit,
}: CommentActionsSheetProps) => {
  const { t } = useLingui()

  return (
    <PopupMenu isOpen={isOpen} onClose={onClose}>
      <div className={css.actions}>
        <Button icon='trash-2' variant='danger' onClick={onDelete}>
          {t`Удалить сообщение`}
        </Button>
        {canEdit && (
          <Button icon='square-pen' variant='secondary' onClick={onEdit}>
            {t`Редактировать`}
          </Button>
        )}
        <Button variant='secondary' onClick={onClose}>
          {t`Отмена`}
        </Button>
      </div>
    </PopupMenu>
  )
}
