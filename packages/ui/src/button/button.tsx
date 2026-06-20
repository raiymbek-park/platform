import { pickCss } from '@raiymbek-park/shared'
import type { ButtonHTMLAttributes } from 'react'
import type { IconGlyph } from '../icon'
import { Icon } from '../icon'
import css from './button.module.scss'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconGlyph
  iconPosition?: 'left' | 'right'
  isLoading?: boolean
  variant?: 'action' | 'secondary'
}

const buttonCss = pickCss(css, css.button)

export const Button = ({
  children,
  className,
  disabled,
  icon,
  iconPosition = 'left',
  isLoading,
  type = 'button',
  variant = 'action',
  ...restProps
}: ButtonProps) => {
  const glyph: IconGlyph | undefined = isLoading ? 'loader-circle' : icon

  return (
    <button
      className={buttonCss({ iconPosition, isLoading, variant }, className)}
      disabled={disabled || isLoading}
      type={type}
      {...restProps}
    >
      {glyph && (
        <Icon
          className={isLoading ? css.spinner : undefined}
          glyph={glyph}
          size={20}
        />
      )}
      {children}
    </button>
  )
}
