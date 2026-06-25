import type { ComponentProps } from 'react'

import { joinCss } from '@raiymbek-park/shared'

import css from './hero-image.module.scss'

export type HeroImageProps = Omit<ComponentProps<'img'>, 'src'> & {
  src: string
}

export const HeroImage = ({
  alt = '',
  className,
  src,
  ...restProps
}: HeroImageProps) => (
  <img
    alt={alt}
    className={joinCss(css.hero, className)}
    src={`${import.meta.env.BASE_URL}${src}`}
    {...restProps}
  />
)
