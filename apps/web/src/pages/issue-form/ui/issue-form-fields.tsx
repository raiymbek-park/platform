import type { IconGlyph } from '@raiymbek-park/ui'
import type { MediaPicker } from '@/shared/media'
import type { IssueFormSubmit, IssueFormValues } from '../lib/validators'

import { useLingui } from '@lingui/react/macro'
import { Input, ScreenTitle, Textarea } from '@raiymbek-park/ui'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'

import { FormDock, FormScreen, inputState } from '@/shared/form'
import { MediaField } from '@/shared/media'

import { issueFormSchema } from '../lib/validators'
import { categoryTheme } from '../model/use-issue-categories'
import { CategoryField } from './category-field'

export type IssueFormFieldsProps = {
  defaultValues: IssueFormValues
  isPending: boolean
  media: MediaPicker
  submitIcon: IconGlyph
  submitLabel: string
  subtitle: string
  title: string
  onSubmit: (values: IssueFormSubmit) => void
}

export const IssueFormFields = ({
  defaultValues,
  isPending,
  media,
  submitIcon,
  submitLabel,
  subtitle,
  title,
  onSubmit,
}: IssueFormFieldsProps) => {
  const { t } = useLingui()
  const navigate = useNavigate()

  const form = useForm({
    defaultValues,
    validators: { onChange: issueFormSchema },
    onSubmit: ({ value }) => {
      if (value.category === null) return
      onSubmit({
        category: value.category,
        description: value.description,
        title: value.title,
        urgent: value.urgent,
      })
    },
  })

  const goBack = () => navigate({ search: { status: 'new' }, to: '/issues' })

  return (
    <FormScreen
      illustration={`${import.meta.env.BASE_URL}images/create-issue.png`}
      onSubmit={form.handleSubmit}
    >
      <ScreenTitle subtitle={subtitle} title={title} />

      <form.Field name='category'>
        {field => (
          <form.Field name='urgent'>
            {urgentField => (
              <CategoryField
                category={field.state.value}
                urgent={urgentField.state.value}
                onSelect={field.handleChange}
                onToggleUrgent={() =>
                  urgentField.handleChange(!urgentField.state.value)
                }
              />
            )}
          </form.Field>
        )}
      </form.Field>

      <form.Subscribe selector={state => state.values.category}>
        {category => {
          const theme = categoryTheme(category)
          return (
            <form.Field name='title'>
              {field => (
                <Input
                  icon={theme.glyph}
                  label={t`Тема заявки`}
                  maxLength={80}
                  placeholder={t`Кратко опишите проблему`}
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
          <Textarea
            label={t`Описание`}
            maxLength={1000}
            placeholder={t`Подробно опишите, что случилось и где…`}
            state={inputState(field.state.meta)}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={event => field.handleChange(event.target.value)}
          />
        )}
      </form.Field>

      <MediaField label={t`Фото`} media={media} />

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
