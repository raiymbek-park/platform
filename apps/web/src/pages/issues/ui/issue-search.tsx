import type { ChangeEvent } from 'react'

import { useLingui } from '@lingui/react/macro'
import { Icon, Input } from '@raiymbek-park/ui'

import css from './issue-search.module.scss'

export type IssueSearchProps = {
  onChange: (value: string) => void
  value: string
}

export const IssueSearch = ({ onChange, value }: IssueSearchProps) => {
  const { t } = useLingui()
  return (
    <Input
      aria-label={t`Поиск по заявкам`}
      data-testid='issue-search'
      placeholder={t`Поиск по заявкам, от 3 символов`}
      trailing={
        value && (
          <button
            aria-label={t`Очистить поиск`}
            className={css.clear}
            type='button'
            onClick={() => onChange('')}
          >
            <Icon glyph='eraser' size={18} />
          </button>
        )
      }
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.value)
      }
    />
  )
}
