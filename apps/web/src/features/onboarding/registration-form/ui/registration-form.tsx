import {
  BlockCard,
  Button,
  InfoCallout,
  Input,
  OptionRow,
  SectionHeader,
} from '@raiymbek-park/ui'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'

import type { BlockId } from '../lib/apartment-ranges'
import { blockIds } from '../lib/apartment-ranges'
import { formatPhoneMask, normalizePhone } from '../lib/phone'
import type { Role } from '../lib/validators'
import {
  validateApartment,
  validateBlock,
  validateName,
  validatePhone,
  validateRole,
} from '../lib/validators'
import { useOnboardingStore } from '../model/use-onboarding-store'
import { useSendOtp } from '../model/use-send-otp'
import css from './registration-form.module.scss'

const roles: { id: Role; label: string }[] = [
  { id: 'owner', label: 'Собственник' },
  { id: 'tenant', label: 'Арендатор' },
]

export const RegistrationForm = () => {
  const navigate = useNavigate()
  const sendOtp = useSendOtp()
  const setDraft = useOnboardingStore(state => state.setDraft)
  const setPendingPhone = useOnboardingStore(state => state.setPendingPhone)

  const form = useForm({
    defaultValues: {
      name: '',
      phone: '',
      block: null as BlockId | null,
      apartment: '',
      role: null as Role | null,
    },
    onSubmit: async ({ value }) => {
      const phone = normalizePhone(value.phone)
      const draft = {
        name: value.name.trim(),
        phone,
        block: value.block,
        apartment: value.apartment,
        role: value.role,
      }
      setDraft(draft)
      setPendingPhone(phone)
      await sendOtp.mutateAsync({ phone })
      navigate({ to: '/onboarding/verify' })
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
      <SectionHeader title='Ваши данные' />

      <form.Field
        name='name'
        validators={{ onChange: ({ value }) => validateName(value) }}
      >
        {field => (
          <Input
            icon='user'
            inputMode='text'
            placeholder='Имя'
            state={field.state.meta.errors.length > 0 ? 'error' : undefined}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={event => field.handleChange(event.target.value)}
          />
        )}
      </form.Field>

      <form.Field
        name='phone'
        validators={{ onChange: ({ value }) => validatePhone(value) }}
      >
        {field => (
          <Input
            icon='phone'
            inputMode='tel'
            placeholder='+7 (___) ___-__-__'
            state={field.state.meta.errors.length > 0 ? 'error' : undefined}
            value={formatPhoneMask(field.state.value)}
            onBlur={field.handleBlur}
            onChange={event => field.handleChange(event.target.value)}
          />
        )}
      </form.Field>

      <SectionHeader title='Блок' />
      <form.Field
        name='block'
        validators={{ onChange: ({ value }) => validateBlock(value) }}
      >
        {field => (
          <fieldset className={css.group}>
            <legend className='sr-only'>Блок</legend>
            <div className={css.blocks}>
              {blockIds.map(block => (
                <BlockCard
                  key={block}
                  icon='building-2'
                  isSelected={field.state.value === block}
                  title={`Блок ${block}`}
                  onClick={() => field.handleChange(block)}
                />
              ))}
            </div>
          </fieldset>
        )}
      </form.Field>

      <form.Subscribe selector={state => state.values.block}>
        {block => (
          <form.Field
            name='apartment'
            validators={{
              onChange: ({ value }) => validateApartment(value, block),
            }}
          >
            {field => (
              <Input
                icon='door-closed'
                inputMode='numeric'
                placeholder='Номер квартиры'
                state={field.state.meta.errors.length > 0 ? 'error' : undefined}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={event =>
                  field.handleChange(event.target.value.replace(/\D/g, ''))
                }
              />
            )}
          </form.Field>
        )}
      </form.Subscribe>

      <SectionHeader title='Вы' />
      <form.Field
        name='role'
        validators={{ onChange: ({ value }) => validateRole(value) }}
      >
        {field => (
          <fieldset className={css.group}>
            <legend className='sr-only'>Роль</legend>
            {roles.map(role => (
              <OptionRow
                key={role.id}
                isSelected={field.state.value === role.id}
                label={role.label}
                onClick={() => field.handleChange(role.id)}
              />
            ))}
          </fieldset>
        )}
      </form.Field>

      {sendOtp.isError && (
        <InfoCallout variant='danger'>
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
