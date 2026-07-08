import type { PostKind } from '@raiymbek-park/shared/validation-schemas'
import type { IconGlyph } from '@raiymbek-park/ui'
import type { ReactNode } from 'react'
import type { MediaPicker } from '@/shared/media'
import type { PostFormSubmit, PostFormValues } from '../lib/validators'

import { useLingui } from '@lingui/react/macro'
import { InfoCallout, Input, ScreenTitle, Textarea } from '@raiymbek-park/ui'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'

import { FormDock, FormScreen, inputState } from '@/shared/form'
import { MediaField } from '@/shared/media'

import { postFormSchema } from '../lib/validators'
import { categoryTheme } from '../model/use-post-categories'
import { CategoryField } from './category-field'
import css from './post-form-fields.module.scss'

export type PostFormFieldsProps = {
  defaultValues: PostFormValues
  illustration: string
  isPending: boolean
  kind: PostKind
  kindSwitcher?: ReactNode
  media: MediaPicker
  submitIcon: IconGlyph
  submitLabel: string
  subtitle: string
  title: string
  onSubmit: (values: PostFormSubmit) => void
}

const tabForKind = (kind: PostKind) =>
  kind === 'offer' ? 'offers' : 'announcements'

export const PostFormFields = ({
  defaultValues,
  illustration,
  isPending,
  kind,
  kindSwitcher,
  media,
  submitIcon,
  submitLabel,
  subtitle,
  title,
  onSubmit,
}: PostFormFieldsProps) => {
  const { t } = useLingui()
  const navigate = useNavigate()

  const form = useForm({
    defaultValues,
    validators: { onChange: postFormSchema(kind) },
    onSubmit: ({ value }) => {
      if (value.category === null) return
      onSubmit({
        category: value.category,
        description: value.description,
        title: value.title,
      })
    },
  })

  const goBack = () =>
    navigate({ search: { tab: tabForKind(kind) }, to: '/posts' })

  return (
    <FormScreen illustration={illustration} onSubmit={form.handleSubmit}>
      <ScreenTitle subtitle={subtitle} title={title} />

      {kindSwitcher}

      <form.Field name='category'>
        {field => (
          <CategoryField
            category={field.state.value}
            kind={kind}
            onSelect={field.handleChange}
          />
        )}
      </form.Field>

      <form.Subscribe selector={state => state.values.category}>
        {category => {
          const theme = categoryTheme(kind, category)
          return (
            <form.Field name='title'>
              {field => (
                <Input
                  icon={theme.glyph}
                  label={t`Заголовок`}
                  maxLength={80}
                  placeholder={t`Кратко о вашем объявлении`}
                  state={inputState(field.state.meta)}
                  tone={theme.tone}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                />
              )}
            </form.Field>
          )
        }}
      </form.Subscribe>

      <form.Field name='description'>
        {field => (
          <div className={css.description}>
            <Textarea
              label={t`Описание`}
              maxLength={1000}
              placeholder={t`Расскажите подробнее о вашем объявлении…`}
              state={inputState(field.state.meta)}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={event => field.handleChange(event.target.value)}
            />
            <p className={css.hint}>{t`Поддерживается разметка Markdown.`}</p>
          </div>
        )}
      </form.Field>

      <MediaField label={t`Фото`} media={media} />

      {kind === 'offer' && (
        <InfoCallout icon='phone'>
          {t`Ваш номер телефона будет виден всем пользователям.`}
        </InfoCallout>
      )}

      <form.Subscribe selector={state => state.canSubmit}>
        {canSubmit => (
          <FormDock
            canSubmit={canSubmit}
            isPending={isPending}
            submitIcon={submitIcon}
            submitLabel={submitLabel}
            onBack={goBack}
          />
        )}
      </form.Subscribe>
    </FormScreen>
  )
}
