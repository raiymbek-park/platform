import type { InputProps } from '@raiymbek-park/ui'

import { Input } from '@raiymbek-park/ui'

export type ApartmentFieldProps = Omit<
  InputProps,
  'icon' | 'inputMode' | 'value' | 'onChange'
> & {
  value: number
  onChange: (value: number) => void
}

export const ApartmentField = ({
  value,
  onChange,
  ...restProps
}: ApartmentFieldProps) => (
  <Input
    icon='door-closed'
    inputMode='numeric'
    value={Number.isNaN(value) ? '' : String(value)}
    onChange={event => {
      const digits = event.target.value.replace(/\D/g, '')
      onChange(digits === '' ? Number.NaN : Number(digits))
    }}
    {...restProps}
  />
)
