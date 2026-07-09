import type { ResidentProfile } from '@raiymbek-park/api'
import type { Locale } from '@/shared/i18n'

import { Trans, useLingui } from '@lingui/react/macro'
import { randomId } from '@raiymbek-park/shared'
import { Button, Divider, SectionHeader, SelectOption } from '@raiymbek-park/ui'
import { useForm } from '@tanstack/react-form'
import { useEffect, useState } from 'react'

import {
  ApartmentField,
  BlockPicker,
  NameField,
  PhoneField,
  RolePicker,
} from '@/entities/resident'
import { LocaleSelect } from '@/features/locale-select'
import { formatPhoneDisplay } from '@/features/onboarding'
import { inputState } from '@/shared/form'
import {
  activateLocale,
  i18n,
  persistLocale,
  resolveLocale,
} from '@/shared/i18n'
import { showToastMessage } from '@/shared/toast'

import { profileFormSchema, toFormValues } from '../lib/profile-form-schema'
import { useUpdateProfile } from '../model/use-update-profile'
import { AvatarUpload } from './avatar-upload'
import { PlatesFieldset } from './plates-fieldset'
import css from './profile-form.module.scss'

const fieldOrder = ['name', 'block', 'apartment', 'role', 'cars'] as const

const toMessage = (error: unknown): string | undefined => {
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error
    return typeof message === 'string' ? message : undefined
  }
  return undefined
}

export type ProfileFormProps = {
  profile: ResidentProfile
}

export const ProfileForm = ({ profile }: ProfileFormProps) => {
  const { t } = useLingui()
  const updateProfile = useUpdateProfile()
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [locale, setLocale] = useState<Locale>(resolveLocale(i18n.locale))
  const [plateIds, setPlateIds] = useState<string[]>(() =>
    toFormValues(profile).cars.map(() => randomId()),
  )

  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  const pickAvatar = (file: File) => {
    setAvatarFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setPreview(null)
    setAvatarUrl(null)
  }

  const selectLocale = (next: Locale) => {
    setLocale(next)
    activateLocale(next)
    persistLocale(next)
  }

  const form = useForm({
    defaultValues: toFormValues(profile),
    validators: { onChange: profileFormSchema },
    onSubmitInvalid: ({ formApi }) => {
      const text = fieldOrder
        .flatMap(name => formApi.getFieldMeta(name)?.errors ?? [])
        .map(toMessage)
        .find(message => Boolean(message))
      if (text) showToastMessage({ kind: 'error', text })
    },
    onSubmit: ({ value }) => {
      if (value.block === null) return
      updateProfile.mutate({
        apartment: value.apartment,
        avatarFile,
        avatarUrl,
        block: value.block,
        cars: value.cars.map(plate => plate.trim()).filter(Boolean),
        isPhoneVisible: value.isPhoneVisible,
        name: value.name.trim(),
        role: value.role,
      })
    },
  })

  const isPending = updateProfile.isPending
  const avatarSrc = preview ?? avatarUrl

  return (
    <form
      className={css.form}
      onSubmit={event => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <AvatarUpload
        disabled={isPending}
        name={profile.name}
        src={avatarSrc}
        onPick={pickAvatar}
        onRemove={removeAvatar}
      />

      <section className={css.section}>
        <SectionHeader title={t`Имя`} />
        <form.Field name='name'>
          {field => (
            <NameField
              disabled={isPending}
              placeholder={t`Введите ваше имя`}
              state={inputState(field.state.meta)}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={event => field.handleChange(event.target.value)}
            />
          )}
        </form.Field>
      </section>

      <section className={css.section}>
        <SectionHeader title={t`Телефон`} />
        <PhoneField readOnly value={formatPhoneDisplay(profile.phone)} />
      </section>

      <section className={css.section}>
        <SectionHeader title={t`Видимость номера`} />
        <form.Field name='isPhoneVisible'>
          {field => (
            <fieldset className={css.card} disabled={isPending}>
              <legend className='sr-only'>
                <Trans>Видимость номера</Trans>
              </legend>
              <SelectOption
                icon='eye'
                isSelected={field.state.value}
                label={t`Открыть`}
                subtitle={t`Ваш контактный номер виден для других жильцов.`}
                tone='brand'
                onClick={() => field.handleChange(true)}
              />
              <Divider />
              <SelectOption
                icon='eye-off'
                isSelected={!field.state.value}
                label={t`Скрыть`}
                subtitle={t`Ваш контактный номер скрыт от других жильцов.`}
                tone='danger'
                onClick={() => field.handleChange(false)}
              />
            </fieldset>
          )}
        </form.Field>
      </section>

      <section className={css.section}>
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
      </section>

      <section className={css.section}>
        <SectionHeader title={t`Номер квартиры`} />
        <form.Field name='apartment'>
          {field => (
            <ApartmentField
              disabled={isPending}
              placeholder='142'
              state={inputState(field.state.meta)}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={value => field.handleChange(value)}
            />
          )}
        </form.Field>
      </section>

      <section className={css.section}>
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
      </section>

      <section className={css.section}>
        <SectionHeader title={t`Номера машин`} />
        <form.Field name='cars'>
          {field => (
            <PlatesFieldset
              disabled={isPending}
              rows={field.state.value.map((value, index) => ({
                id: plateIds[index] ?? String(index),
                value,
              }))}
              onAdd={() => {
                setPlateIds(ids => [...ids, randomId()])
                field.handleChange([...field.state.value, ''])
              }}
              onRemove={index => {
                setPlateIds(ids => ids.filter((_, i) => i !== index))
                field.handleChange(
                  field.state.value.filter((_, i) => i !== index),
                )
              }}
              onUpdate={(index, value) =>
                field.handleChange(
                  field.state.value.map((plate, i) =>
                    i === index ? value : plate,
                  ),
                )
              }
            />
          )}
        </form.Field>
      </section>

      <section className={css.section}>
        <SectionHeader title={t`Выберите язык`} />
        <LocaleSelect value={locale} onSelect={selectLocale} />
      </section>

      <Button
        className={css.submit}
        icon='save'
        isLoading={isPending}
        type='submit'
      >
        <Trans>Сохранить</Trans>
      </Button>
    </form>
  )
}
