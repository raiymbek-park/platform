import type { ChangeEvent } from 'react'

import { useLingui } from '@lingui/react/macro'
import { Icon, Input } from '@raiymbek-park/ui'

import css from './post-search.module.scss'

export type PostSearchProps = {
  onChange: (value: string) => void
  value: string
}

export const PostSearch = ({ onChange, value }: PostSearchProps) => {
  const { t } = useLingui()
  return (
    <Input
      aria-label={t`Поиск по объявлениям`}
      data-testid='post-search'
      placeholder={t`Поиск по объявлениям, от 2 символов`}
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
