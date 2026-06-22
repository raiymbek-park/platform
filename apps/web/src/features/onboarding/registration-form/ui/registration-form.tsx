import type { BlockId } from '@raiymbek-park/api/contract'

import { blockFloors, blockIds } from '@raiymbek-park/api/contract'
import {
  BlockCard,
  Button,
  Divider,
  InfoCallout,
  Input,
  OptionRow,
  SectionHeader,
  WelcomeCard,
} from '@raiymbek-park/ui'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'

import { isSendCooldown } from '../lib/is-send-cooldown'
import { formatPhoneMask, normalizePhone } from '../lib/phone'
import { registrationSchema } from '../lib/validators'
import { useOnboardingStore } from '../model/use-onboarding-store'
import { useSendOtp } from '../model/use-send-otp'
import css from './registration-form.module.scss'

const blockTones: Record<BlockId, 'brand' | 'danger' | 'accent' | 'info'> = {
  1: 'danger',
  2: 'brand',
  3: 'accent',
  4: 'info',
}

export const RegistrationForm = () => {
  const navigate = useNavigate()
  const sendOtp = useSendOtp()
  const setDraft = useOnboardingStore(state => state.setDraft)
  const draft = useOnboardingStore(state => state.draft)

  const form = useForm({
    defaultValues: draft,
    validators: { onChange: registrationSchema },
    onSubmit: ({ value }) => {
      const phone = normalizePhone(value.phone)
      setDraft({
        name: value.name.trim(),
        phone,
        block: value.block,
        apartment: value.apartment,
        role: value.role,
      })

      const toVerification = () => navigate({ to: '/onboarding/verification' })
      sendOtp.mutate(
        { phone },
        {
          onSuccess: result => {
            if (result.lockedUntil !== null) {
              navigate({ to: '/onboarding/locked' })
              return
            }
            toVerification()
          },
          onError: error => {
            if (isSendCooldown(error)) toVerification()
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
      <WelcomeCard
        description='Добро пожаловать в личное пространство жильцов и собственников квартир ЖК «Raiymbek Park». Здесь собрано всё самое важное: свежие объявления от управляющей компании, форма для подачи заявок на устранение неполадок, контакты дежурных служб и история ваших обращений. Мы хотим, чтобы каждый вопрос решался быстро и понятно — чтобы жизнь в доме была удобнее, а управление домом — прозрачнее.'
        title='Добро пожаловать!'
      />

      <form.Field name='name'>
        {field => (
          <Input
            icon='user'
            inputMode='text'
            label='Имя'
            placeholder='Введите ваше имя'
            state={
              field.state.meta.isTouched && field.state.meta.errors.length > 0
                ? 'error'
                : undefined
            }
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
            label='Телефон'
            placeholder='+7 (___) ___-__-__'
            state={
              field.state.meta.isTouched && field.state.meta.errors.length > 0
                ? 'error'
                : undefined
            }
            value={formatPhoneMask(field.state.value)}
            onBlur={field.handleBlur}
            onChange={event => field.handleChange(event.target.value)}
          />
        )}
      </form.Field>

      <div className={css.section}>
        <SectionHeader title='Выберите блок' />
        <form.Field name='block'>
          {field => (
            <fieldset className={css.group}>
              <legend className='sr-only'>Блок</legend>
              <div className={css.blocks}>
                {blockIds.map(block => (
                  <BlockCard
                    key={block}
                    description={`${blockFloors[block]} жилых этажей`}
                    icon='building-2'
                    isSelected={field.state.value === block}
                    title={`Блок ${block}`}
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
            label='Номер квартиры'
            placeholder='142'
            state={
              field.state.meta.isTouched && field.state.meta.errors.length > 0
                ? 'error'
                : undefined
            }
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
        <SectionHeader title='Кто вы?' />
        <form.Field name='role'>
          {field => (
            <fieldset className={css.group}>
              <legend className='sr-only'>Роль</legend>
              <div className={css.roleCard}>
                <OptionRow
                  icon='house'
                  isSelected={field.state.value === 'owner'}
                  label='Собственник квартиры'
                  subtitle='Владею жильём'
                  tone='brand'
                  onClick={() => field.handleChange('owner')}
                />
                <Divider />
                <OptionRow
                  icon='key-round'
                  isSelected={field.state.value === 'tenant'}
                  label='Арендатор'
                  subtitle='Снимаю жильё'
                  tone='danger'
                  onClick={() => field.handleChange('tenant')}
                />
              </div>
            </fieldset>
          )}
        </form.Field>
      </div>

      <InfoCallout icon='shield-check'>
        Ваши личные данные скрыты от других жильцов. Доступ к ним имеет только
        администрация — для быстрой связи в экстренных случаях (затопление,
        пожар).
      </InfoCallout>

      {sendOtp.isError && (
        <InfoCallout icon='circle-alert' variant='danger'>
          Не удалось отправить код. Проверьте соединение и попробуйте снова.
        </InfoCallout>
      )}

      <footer className={css.footer}>
        <form.Subscribe selector={state => state.canSubmit}>
          {canSubmit => (
            <Button
              className={css.submit}
              disabled={!canSubmit || sendOtp.isPending}
              icon='arrow-right'
              iconPosition='right'
              isLoading={sendOtp.isPending}
              type='submit'
            >
              Далее
            </Button>
          )}
        </form.Subscribe>
      </footer>
    </form>
  )
}
