import { Trans, useLingui } from '@lingui/react/macro'
import { Button, HeroCard, InfoCallout, SectionHeader } from '@raiymbek-park/ui'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'

import {
  ApartmentField,
  BlockPicker,
  NameField,
  PhoneField,
  RolePicker,
} from '@/entities/resident'
import { inputState } from '@/shared/form'
import { showToastMessage } from '@/shared/toast'

import { sendCodeErrorText } from '../lib/auth-error'
import { isTooManyRequests } from '../lib/is-too-many-requests'
import { normalizePhone } from '../lib/phone'
import { registrationSchema } from '../lib/validators'
import { useOnboardingStore } from '../model/use-onboarding-store'
import { useSendOtp } from '../model/use-send-otp'
import css from './registration-form.module.scss'

const fieldOrder = ['name', 'phone', 'block', 'apartment', 'role'] as const

const toMessage = (error: unknown): string | undefined => {
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error
    return typeof message === 'string' ? message : undefined
  }
  return undefined
}

export const RegistrationForm = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const sendOtp = useSendOtp()
  const setDraft = useOnboardingStore(state => state.setDraft)
  const draft = useOnboardingStore(state => state.draft)

  const form = useForm({
    defaultValues: { ...draft, phone: draft.phone || '+7' },
    validators: { onChange: registrationSchema },
    onSubmitInvalid: ({ formApi }) => {
      const text = fieldOrder
        .flatMap(name => formApi.getFieldMeta(name)?.errors ?? [])
        .map(toMessage)
        .find(message => Boolean(message))
      if (text) showToastMessage({ kind: 'error', text })
    },
    onSubmit: ({ value }) => {
      const phone = normalizePhone(value.phone)
      setDraft({
        name: value.name.trim(),
        phone,
        block: value.block,
        apartment: value.apartment,
        role: value.role,
      })

      sendOtp.mutate(
        { phone },
        {
          onSuccess: () => navigate({ to: '/onboarding/verification' }),
          onError: error => {
            if (isTooManyRequests(error)) {
              navigate({ to: '/onboarding/locked' })
              return
            }
            showToastMessage({ kind: 'error', text: sendCodeErrorText(error) })
          },
        },
      )
    },
  })

  const isPending = sendOtp.isPending

  return (
    <form
      className={css.form}
      onSubmit={event => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
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

      <form.Field name='name'>
        {field => (
          <NameField
            disabled={isPending}
            label={t`Имя`}
            placeholder={t`Введите ваше имя`}
            state={inputState(field.state.meta)}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={event => field.handleChange(event.target.value)}
          />
        )}
      </form.Field>

      <form.Field name='phone'>
        {field => (
          <PhoneField
            disabled={isPending}
            label={t`Телефон`}
            placeholder='+7 7xxx xxx xxxx'
            state={inputState(field.state.meta)}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={event => field.handleChange(event.target.value)}
          />
        )}
      </form.Field>

      <InfoCallout icon='shield-check'>
        <Trans>
          Ваши личные данные скрыты от других жильцов. Доступ к ним имеет только
          администрация — для быстрой связи в экстренных случаях (затопление,
          пожар).
        </Trans>
      </InfoCallout>

      <div className={css.section}>
        <SectionHeader title={t`Выберите блок`} />
        <form.Field name='block'>
          {field => (
            <BlockPicker
              disabled={isPending}
              value={field.state.value}
              onChange={block => field.handleChange(block)}
            />
          )}
        </form.Field>
      </div>

      <form.Field name='apartment'>
        {field => (
          <ApartmentField
            disabled={isPending}
            label={t`Номер квартиры`}
            placeholder='142'
            state={inputState(field.state.meta)}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={value => field.handleChange(value)}
          />
        )}
      </form.Field>

      <div className={css.section}>
        <SectionHeader title={t`Кто вы?`} />
        <form.Field name='role'>
          {field => (
            <RolePicker
              disabled={isPending}
              value={field.state.value}
              onChange={role => field.handleChange(role)}
            />
          )}
        </form.Field>
      </div>

      <div className={css.actions}>
        <Button
          aria-label={t`Назад`}
          disabled={isPending}
          icon='arrow-left'
          type='button'
          variant='icon'
          onClick={() => navigate({ to: '/onboarding/language' })}
        />
        <Button
          className={css.fill}
          disabled={isPending}
          icon='arrow-right'
          iconPosition='right'
          isLoading={isPending}
          type='submit'
        >
          <Trans>Далее</Trans>
        </Button>
      </div>
    </form>
  )
}
