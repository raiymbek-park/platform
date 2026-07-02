import type { BlockId } from '@raiymbek-park/shared/validation-schemas'

import { Trans, useLingui } from '@lingui/react/macro'
import { blockFloors, blockIds } from '@raiymbek-park/shared/validation-schemas'
import {
  BlockCard,
  Button,
  Divider,
  HeroCard,
  InfoCallout,
  Input,
  SectionHeader,
  SelectOption,
} from '@raiymbek-park/ui'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { useRef } from 'react'

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

type FieldMeta = {
  errors: readonly unknown[]
  isDirty: boolean
  isTouched: boolean
}

const inputState = ({ errors, isDirty, isTouched }: FieldMeta) => {
  if (errors.length > 0) return isTouched ? 'error' : undefined
  return isDirty ? 'success' : undefined
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
            if (isTooManyRequests(error)) navigate({ to: '/onboarding/locked' })
          },
        },
      )
    },
  })

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
        {field => (
          <Input
            icon='phone'
            inputMode='tel'
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
            <fieldset className={css.group}>
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
            <fieldset className={css.group}>
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

      {sendVerification.isError && (
        <InfoCallout icon='circle-alert' variant='danger'>
          <Trans>
            Не удалось отправить код. Проверьте соединение и попробуйте снова.
          </Trans>
        </InfoCallout>
      )}

      <form.Subscribe selector={state => state.canSubmit}>
        {canSubmit => (
          <Button
            className={css.submit}
            disabled={!canSubmit || sendVerification.isPending}
            icon='arrow-right'
            iconPosition='right'
            isLoading={sendVerification.isPending}
            type='submit'
          >
            <Trans>Далее</Trans>
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
