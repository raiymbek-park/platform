import type { ComponentProps } from 'react'

import { joinCss, pickCss } from '@raiymbek-park/shared'
import { useState } from 'react'

import { IconChip } from '../icon-chip/icon-chip'
import css from './screen-header.module.scss'

const languages = ['KZ', 'RU', 'EN'] as const

type Language = (typeof languages)[number]

const chipCss = pickCss(css, css.chip)

export type ScreenHeaderProps = ComponentProps<'header'>

export const ScreenHeader = ({
  className,
  ...restProps
}: ScreenHeaderProps) => {
  const [language, setLanguage] = useState<Language>('RU')

  return (
    <header className={joinCss(css.screen, className)} {...restProps}>
      <div className={css.logo}>
        <IconChip glyph='building-2' iconSize={24} size={40} />
        <span className={css.brand}>Raiymbek Park</span>
      </div>
      <div className={css.switcher}>
        {languages.map(code => (
          <button
            key={code}
            className={chipCss({ isActive: language === code })}
            type='button'
            onClick={() => setLanguage(code)}
          >
            {code}
          </button>
        ))}
      </div>
    </header>
  )
}
