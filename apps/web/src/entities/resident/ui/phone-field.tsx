import type { InputProps } from '@raiymbek-park/ui'

import { Icon, Input } from '@raiymbek-park/ui'

import css from './fields.module.scss'

export type PhoneFieldProps = Omit<
  InputProps,
  'icon' | 'inputMode' | 'trailing'
>

export const PhoneField = ({ state, ...restProps }: PhoneFieldProps) => (
  <Input
    icon='phone'
    inputMode='tel'
    state={state}
    trailing={
      state ? undefined : (
        <Icon className={css.eye} glyph='eye-closed' size={20} />
      )
    }
    {...restProps}
  />
)
