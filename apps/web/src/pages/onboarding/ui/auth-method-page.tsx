import type { AuthMethod } from '@/features/onboarding'

import { Trans, useLingui } from '@lingui/react/macro'
import { Button, Content, HeroCard, SectionHeader } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import {
  AuthMethodSelect,
  isPopupBlocked,
  isPopupDismissed,
  logAuthError,
  useAuthMethodStore,
  useSocialSignIn,
} from '@/features/onboarding'
import { showToastMessage } from '@/shared/toast'

import css from './auth-method-page.module.scss'

export const AuthMethodPage = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const method = useAuthMethodStore(state => state.method)
  const setMethod = useAuthMethodStore(state => state.setMethod)
  const socialSignIn = useSocialSignIn()
  const [selected, setSelected] = useState<AuthMethod>(method ?? 'phone')

  const blockedError = t`Не удалось открыть окно входа. Попробуйте ещё раз.`
  const networkError = t`Не удалось выполнить вход. Проверьте соединение.`

  const confirm = () => {
    if (selected === 'phone') {
      setMethod('phone')
      navigate({ to: '/onboarding/registration' })
      return
    }
    socialSignIn.mutate(selected, {
      onSuccess: () => {
        setMethod(selected)
        navigate({ to: '/onboarding/registration' })
      },
      onError: error => {
        if (isPopupDismissed(error)) return
        logAuthError('social-sign-in', error)
        showToastMessage({
          kind: 'error',
          text: isPopupBlocked(error) ? blockedError : networkError,
        })
      },
    })
  }

  return (
    <Content>
      <HeroCard title={t`Добро пожаловать!`}>
        <Trans>
          Добро пожаловать в личное пространство жильцов и собственников квартир
          ЖК «Raiymbek Park». Здесь собрано всё самое важное: свежие объявления
          от управляющей компании, форма для подачи заявок на устранение
          неполадок, контакты дежурных служб и история ваших обращений. Мы
          хотим, чтобы каждый вопрос решался быстро и понятно — чтобы жизнь в
          доме была удобнее, а управление домом — прозрачнее.
        </Trans>
      </HeroCard>

      <div className={css.spacer} />

      <section className={css.section}>
        <SectionHeader title={t`Выберите способ входа`} />
        <AuthMethodSelect value={selected} onSelect={setSelected} />
      </section>

      <div className={css.actions}>
        <Button
          aria-label={t`Назад`}
          disabled={socialSignIn.isPending}
          icon='arrow-left'
          type='button'
          variant='icon'
          onClick={() => navigate({ to: '/onboarding/language' })}
        />
        <Button
          className={css.fill}
          disabled={socialSignIn.isPending}
          icon='arrow-right'
          iconPosition='right'
          isLoading={socialSignIn.isPending}
          type='button'
          onClick={confirm}
        >
          <Trans>Выбрать</Trans>
        </Button>
      </div>
    </Content>
  )
}
