import { pickCss } from '@raiymbek-park/shared'
import type { ChangeEvent, ComponentProps } from 'react'
import css from './otp-input.module.scss'

export type OtpInputProps = Omit<ComponentProps<'input'>, 'onChange'> & {
  state?: 'error' | 'success'
  onChange?: (value: string) => void
}

const cellCss = pickCss(css, css.cell)

const lastDigit = (value: string) => value.replace(/\D/g, '').slice(-1)

export const OtpInput = ({
  className,
  state,
  onChange,
  ...restProps
}: OtpInputProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) =>
    onChange?.(lastDigit(event.target.value))

  return (
    <input
      className={cellCss({ state }, className)}
      {...restProps}
      inputMode='numeric'
      maxLength={1}
      onChange={handleChange}
    />
  )
}
