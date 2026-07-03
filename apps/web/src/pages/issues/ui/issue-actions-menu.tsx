import { useLingui } from '@lingui/react/macro'
import { Icon } from '@raiymbek-park/ui'
import { useRef } from 'react'

import css from './issue-actions-menu.module.scss'

export type IssueActionsMenuProps = {
  onDelete: () => void
}

export const IssueActionsMenu = ({ onDelete }: IssueActionsMenuProps) => {
  const { t } = useLingui()
  const ref = useRef<HTMLDetailsElement>(null)

  const handleDelete = () => {
    if (ref.current) ref.current.open = false
    onDelete()
  }

  return (
    <details ref={ref} className={css.menu}>
      <summary aria-label={t`Действия`} className={css.trigger}>
        <Icon glyph='ellipsis' size={20} />
      </summary>
      <div className={css.sheet}>
        <button className={css.item} type='button' onClick={handleDelete}>
          <Icon glyph='trash-2' size={18} />
          {t`Удалить`}
        </button>
      </div>
    </details>
  )
}
