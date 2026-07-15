import { Trans, useLingui } from '@lingui/react/macro'
import { Button, InfoCallout, SectionHeader } from '@raiymbek-park/ui'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'

import {
  ApartmentField,
  BlockPicker,
  NameField,
  PhoneField,
  RolePicker,
} from '@/entities/resident'
import { auth } from '@/shared/firebase'
import { inputState } from '@/shared/form'
import { showToastMessage } from '@/shared/toast'

import { sendCodeErrorText } from '../lib/auth-error'
import { hasReliableCarrierPrefix } from '../lib/carrier-warning'
import { isTooManyRequests } from '../lib/is-too-many-requests'
import { normalizePhone } from '../lib/phone'
import {
  smsRegistrationSchema,
  socialRegistrationSchema,
} from '../lib/validators'
import { useOnboardingStore } from '../model/use-onboarding-store'
import { useRegisterResident } from '../model/use-register-resident'
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
  const registerResident = useRegisterResident()
  const setDraft = useOnboardingStore(state => state.setDraft)
  const draft = useOnboardingStore(state => state.draft)

  const isSocialChannel = auth.currentUser !== null
  const providerName = auth.currentUser?.displayName ?? ''

  const registerError = t`Не удалось завершить регистрацию. Повторите попытку.`

  const form = useForm({
    defaultValues: { ...draft, name: draft.name || providerName },
    validators: {
      onChange: isSocialChannel
        ? socialRegistrationSchema
        : smsRegistrationSchema,
    },
    onSubmitInvalid: ({ formApi }) => {
      const text = fieldOrder
        .flatMap(name => formApi.getFieldMeta(name)?.errors ?? [])
        .map(toMessage)
        .find(message => Boolean(message))
      if (text) showToastMessage({ kind: 'error', text })
    },
    onSubmit: ({ value }) => {
      const { block, role } = value
      if (block === null || role === null) return
      const name = value.name.trim()
      const phone = value.phone.trim() === '' ? '' : normalizePhone(value.phone)
      setDraft({ name, phone, block, apartment: value.apartment, role })

      if (isSocialChannel) {
        registerResident.mutate(
          { name, phone, block, apartment: value.apartment, role },
          {
            onSuccess: () => navigate({ to: '/home' }),
            onError: () =>
              showToastMessage({ kind: 'error', text: registerError }),
          },
        )
        return
      }

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
            navigate({ to: '/onboarding/verification' })
          },
        },
      )
    },
  })

  const isPending = sendOtp.isPending || registerResident.isPending

  return (
    <form
      className={css.form}
      onSubmit={event => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
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
            placeholder='+7 701 123 44 55'
            state={inputState(field.state.meta)}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={event => field.handleChange(event.target.value)}
          />
        )}
      </form.Field>

      {!isSocialChannel && (
        <form.Subscribe selector={state => state.values.phone}>
          {phone =>
            hasReliableCarrierPrefix(phone) ? null : (
              <InfoCallout icon='circle-alert' variant='warning'>
                <Trans>
                  Код может не дойти до этого номера. Надёжнее войти через
                  Google или Facebook.
                </Trans>
              </InfoCallout>
            )
          }
        </form.Subscribe>
      )}

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

      {registerResident.isError && (
        <Button
          type='button'
          variant='secondary'
          onClick={() => form.handleSubmit()}
        >
          <Trans>Повторить попытку</Trans>
        </Button>
      )}

      <div className={css.actions}>
        <Button
          aria-label={t`Назад`}
          disabled={isPending}
          icon='arrow-left'
          type='button'
          variant='icon'
          onClick={() => navigate({ to: '/onboarding/auth-method' })}
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
