import type { AnyFieldApi } from '@tanstack/react-form'

import { Textarea } from '@raiymbek-park/ui'

import { inputState } from './field-state'

export type TextareaFieldProps = {
  field: AnyFieldApi
  label: string
  maxLength: number
  placeholder: string
}

export const TextareaField = ({
  field,
  label,
  maxLength,
  placeholder,
}: TextareaFieldProps) => (
  <Textarea
    label={label}
    maxLength={maxLength}
    placeholder={placeholder}
    state={inputState(field.state.meta)}
    value={field.state.value}
    onBlur={field.handleBlur}
    onChange={event => field.handleChange(event.target.value)}
  />
)
