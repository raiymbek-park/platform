import type { SelectCardOption, SelectOptionTone } from '@raiymbek-park/ui'
import type { Locale } from '@/shared/i18n'

import { Trans } from '@lingui/react/macro'
import { SelectCard } from '@raiymbek-park/ui'

import { localeNames } from '@/shared/i18n'

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
  <SelectCard
    legend={<Trans>Язык</Trans>}
    options={displayOrder.map(
      (locale): SelectCardOption => ({
        icon: 'languages',
        isSelected: value === locale,
        key: locale,
        label: localeNames[locale].name,
        subtitle: localeNames[locale].caption,
        tone: localeTones[locale],
        onSelect: () => onSelect(locale),
      }),
    )}
  />
)
