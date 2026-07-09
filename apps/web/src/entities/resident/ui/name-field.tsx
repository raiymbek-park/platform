import type { InputProps } from '@raiymbek-park/ui'

import { Input } from '@raiymbek-park/ui'

export type NameFieldProps = Omit<InputProps, 'icon' | 'inputMode'>

export const NameField = (props: NameFieldProps) => (
  <Input icon='user' inputMode='text' {...props} />
)
