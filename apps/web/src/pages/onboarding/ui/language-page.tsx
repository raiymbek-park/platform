import type { Locale } from '@/shared/i18n'

import { Trans, useLingui } from '@lingui/react/macro'
import { Button, Content, HeroImage, SectionHeader } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { LocaleSelect, useSwitchLocale } from '@/features/locale-select'
import { activateLocale, i18n, resolveLocale } from '@/shared/i18n'

import css from './language-page.module.scss'

export const LanguagePage = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const switchLocale = useSwitchLocale()
  const [selected, setSelected] = useState<Locale>(resolveLocale(i18n.locale))

  const selectLocale = (locale: Locale) => {
    setSelected(locale)
    activateLocale(locale)
  }

  const confirm = async () => {
    await switchLocale(selected)
    navigate({ to: '/onboarding/auth-method' })
  }

  return (
    <Content>
      <HeroImage src='images/hello.png' />

      <div className={css.spacer} />

      <section className={css.section}>
        <SectionHeader title={t`Выберите язык`} />
        <LocaleSelect value={selected} onSelect={selectLocale} />
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
