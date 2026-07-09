import type { ChangeEvent, ComponentProps } from 'react'

import { Icon, Input } from '@raiymbek-park/ui'

import css from './search-field.module.scss'

export type SearchFieldProps = Omit<
  ComponentProps<typeof Input>,
  'onChange' | 'trailing' | 'value'
> & {
  clearLabel: string
  value: string
  onChange: (value: string) => void
}

export const SearchField = ({
  clearLabel,
  value,
  onChange,
  ...restProps
}: SearchFieldProps) => (
  <Input
    {...restProps}
    trailing={
      value && (
        <button
          aria-label={clearLabel}
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
