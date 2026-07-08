import type { BlockId } from '@raiymbek-park/shared/validation-schemas'

import { Trans, useLingui } from '@lingui/react/macro'
import { blockFloors, blockIds } from '@raiymbek-park/shared/validation-schemas'
import {
  BlockCard,
  Button,
  Divider,
  HeroCard,
  Icon,
  InfoCallout,
  Input,
  SectionHeader,
  SelectOption,
} from '@raiymbek-park/ui'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { useRef } from 'react'

import { inputState } from '@/shared/form'
import { showToastMessage } from '@/shared/toast'

import { sendCodeErrorText } from '../lib/auth-error'
import { isTooManyRequests } from '../lib/is-too-many-requests'
import { normalizePhone } from '../lib/phone'
import { registrationSchema } from '../lib/validators'
import { useOnboardingStore } from '../model/use-onboarding-store'
import { useSendVerification } from '../model/use-send-verification'
import css from './registration-form.module.scss'

const blockTones: Record<BlockId, 'brand' | 'danger' | 'accent' | 'info'> = {
  1: 'danger',
  2: 'brand',
  3: 'accent',
  4: 'info',
}

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
  const sendVerification = useSendVerification()
  const setDraft = useOnboardingStore(state => state.setDraft)
  const draft = useOnboardingStore(state => state.draft)
  const recaptchaRef = useRef<HTMLSpanElement>(null)

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
      const container = recaptchaRef.current
      if (container === null) return
      const phone = normalizePhone(value.phone)
      setDraft({
        name: value.name.trim(),
        phone,
        block: value.block,
        apartment: value.apartment,
        role: value.role,
      })

      sendVerification.mutate(
        { container, phone },
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

  const isPending = sendVerification.isPending

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
          <Input
            disabled={isPending}
            icon='user'
            inputMode='text'
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
        {field => {
          const state = inputState(field.state.meta)
          return (
            <Input
              disabled={isPending}
              icon='phone'
              inputMode='tel'
              label={t`Телефон`}
              placeholder='+7 7xxx xxx xxxx'
              state={state}
              trailing={
                state ? undefined : (
                  <Icon className={css.eye} glyph='eye-closed' size={20} />
                )
              }
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={event => field.handleChange(event.target.value)}
            />
          )
        }}
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
            <fieldset className={css.group} disabled={isPending}>
              <legend className='sr-only'>
                <Trans>Блок</Trans>
              </legend>
              <div className={css.blocks}>
                {blockIds.map(block => (
                  <BlockCard
                    key={block}
                    description={t`${blockFloors[block]} жилых этажей`}
                    icon='building-2'
                    isSelected={field.state.value === block}
                    title={t`Блок ${block}`}
                    tone={blockTones[block]}
                    onClick={() => field.handleChange(block)}
                  />
                ))}
              </div>
            </fieldset>
          )}
        </form.Field>
      </div>

      <form.Field name='apartment'>
        {field => (
          <Input
            disabled={isPending}
            icon='door-closed'
            inputMode='numeric'
            label={t`Номер квартиры`}
            placeholder='142'
            state={inputState(field.state.meta)}
            value={
              Number.isNaN(field.state.value) ? '' : String(field.state.value)
            }
            onBlur={field.handleBlur}
            onChange={event => {
              const digits = event.target.value.replace(/\D/g, '')
              field.handleChange(digits === '' ? Number.NaN : Number(digits))
            }}
          />
        )}
      </form.Field>

      <div className={css.section}>
        <SectionHeader title={t`Кто вы?`} />
        <form.Field name='role'>
          {field => (
            <fieldset className={css.group} disabled={isPending}>
              <legend className='sr-only'>
                <Trans>Роль</Trans>
              </legend>
              <div className={css.roleCard}>
                <SelectOption
                  icon='house'
                  isSelected={field.state.value === 'owner'}
                  label={t`Собственник квартиры`}
                  subtitle={t`Владею жильём`}
                  tone='brand'
                  onClick={() => field.handleChange('owner')}
                />
                <Divider />
                <SelectOption
                  icon='key-round'
                  isSelected={field.state.value === 'tenant'}
                  label={t`Арендатор`}
                  subtitle={t`Снимаю жильё`}
                  tone='danger'
                  onClick={() => field.handleChange('tenant')}
                />
              </div>
            </fieldset>
          )}
        </form.Field>
      </div>

      <InfoCallout icon='shield-check'>
        <span ref={recaptchaRef} />
        <a
          className={css.notice}
          href='https://policies.google.com/privacy'
          rel='noopener noreferrer'
          target='_blank'
        >
          <Trans>
            Эта форма защищена reCAPTCHA, применяются Политика
            конфиденциальности и Условия Google
          </Trans>
        </a>
      </InfoCallout>

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
