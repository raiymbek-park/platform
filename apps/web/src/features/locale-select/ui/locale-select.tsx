import type { SelectOptionTone } from '@raiymbek-park/ui'
import type { Locale } from '@/shared/i18n'

import { Trans } from '@lingui/react/macro'
import { Divider, SelectOption } from '@raiymbek-park/ui'
import { Fragment } from 'react'

import { localeNames } from '@/shared/i18n'

import css from './locale-select.module.scss'

const displayOrder: Locale[] = ['kk', 'ru', 'en']

const localeTones: Record<Locale, SelectOptionTone> = {
  en: 'warning',
  kk: 'action',
  ru: 'accent',
}

export type LocaleSelectProps = {
  value: Locale
  onSelect: (locale: Locale) => void
}

export const LocaleSelect = ({ value, onSelect }: LocaleSelectProps) => (
  <fieldset className={css.card}>
    <legend className='sr-only'>
      <Trans>Язык</Trans>
    </legend>
    {displayOrder.map((locale, index) => (
      <Fragment key={locale}>
        {index > 0 && <Divider />}
        <SelectOption
          icon='languages'
          isSelected={value === locale}
          label={localeNames[locale].name}
          subtitle={localeNames[locale].caption}
          tone={localeTones[locale]}
          onClick={() => onSelect(locale)}
        />
      </Fragment>
    ))}
  </fieldset>
)
