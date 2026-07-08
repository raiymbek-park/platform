import type { SelectOptionTone } from '@raiymbek-park/ui'
import type { Locale } from '@/shared/i18n'

import { Trans, useLingui } from '@lingui/react/macro'
import {
  Button,
  Content,
  Divider,
  HeroImage,
  SectionHeader,
  SelectOption,
} from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'
import { Fragment, useState } from 'react'

import {
  activateLocale,
  i18n,
  localeNames,
  persistLocale,
  resolveLocale,
} from '@/shared/i18n'

import css from './language-page.module.scss'

const displayOrder: Locale[] = ['kk', 'ru', 'en']

const localeTones: Record<Locale, SelectOptionTone> = {
  ru: 'accent',
  kk: 'action',
  en: 'warning',
}

export const LanguagePage = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Locale>(resolveLocale(i18n.locale))

  const selectLocale = (locale: Locale) => {
    setSelected(locale)
    activateLocale(locale)
  }

  const confirm = async () => {
    await activateLocale(selected)
    persistLocale(selected)
    navigate({ to: '/onboarding/welcome' })
  }

  return (
    <Content>
      <HeroImage src='images/hello.png' />

      <div className={css.spacer} />

      <section className={css.section}>
        <SectionHeader title={t`Выберите язык`} />
        <fieldset className={css.card}>
          <legend className='sr-only'>
            <Trans>Язык</Trans>
          </legend>
          {displayOrder.map((locale, index) => (
            <Fragment key={locale}>
              {index > 0 && <Divider />}
              <SelectOption
                icon='languages'
                isSelected={selected === locale}
                label={localeNames[locale].name}
                subtitle={localeNames[locale].caption}
                tone={localeTones[locale]}
                onClick={() => selectLocale(locale)}
              />
            </Fragment>
          ))}
        </fieldset>
      </section>

      <Button
        className={css.submit}
        icon='arrow-right'
        iconPosition='right'
        onClick={confirm}
      >
        <Trans>Далее</Trans>
      </Button>
    </Content>
  )
}
