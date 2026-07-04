import type { IssueFormValues } from '../lib/validators'

import { useLingui } from '@lingui/react/macro'
import {
  Button,
  Content,
  ImageForm,
  Input,
  ScreenHeader,
  Textarea,
} from '@raiymbek-park/ui'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'

import { issueFormSchema } from '../lib/validators'
import { useCreateIssue } from '../model/use-create-issue'
import { categoryTheme } from '../model/use-issue-categories'
import { useMediaPicker } from '../model/use-media-picker'
import { CategoryField } from './category-field'
import css from './issues-new-page.module.scss'

type FieldMeta = {
  errors: readonly unknown[]
  isDirty: boolean
  isTouched: boolean
}

const inputState = ({ errors, isDirty, isTouched }: FieldMeta) => {
  if (errors.length > 0) return isTouched ? 'error' : undefined
  return isDirty ? 'success' : undefined
}

const defaultValues: IssueFormValues = {
  category: null,
  description: '',
  title: '',
  urgent: false,
}

export const IssuesNewPage = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const media = useMediaPicker()
  const { createIssue, isPending } = useCreateIssue()

  const form = useForm({
    defaultValues,
    validators: { onChange: issueFormSchema },
    onSubmit: ({ value }) => {
      if (value.category === null) return
      createIssue({
        category: value.category,
        description: value.description,
        files: media.files,
        title: value.title,
        urgent: value.urgent,
      })
    },
  })

  const goBack = () => navigate({ search: { status: 'new' }, to: '/issues' })

  return (
    <form
      className={css.form}
      onSubmit={event => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <ScreenHeader />
      <img
        alt=''
        className={css.illustration}
        src={`${import.meta.env.BASE_URL}images/create-issue.png`}
      />
      <Content gap={24}>
        <header className={css.intro}>
          <h1 className={css.title}>{t`Новая заявка`}</h1>
          <p className={css.subtitle}>
            {t`Опишите проблему или вопрос, который вы хотите направить управляющей компании или жителям нашего ЖК.`}
          </p>
        </header>

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

        <div className={css.field}>
          <span className={css.label}>{t`Фото`}</span>
          <ImageForm
            activeIndex={media.activeIndex}
            addLabel={t`Добавить`}
            photos={media.photos}
            removeLabel={t`Удалить`}
            onAdd={media.add}
            onRemove={media.removeCurrent}
            onSelect={media.select}
          />
        </div>

        <div className={css.dock}>
          <Button
            aria-label={t`Назад`}
            icon='arrow-left'
            type='button'
            variant='icon'
            onClick={goBack}
          />
          <form.Subscribe selector={state => state.canSubmit}>
            {canSubmit => (
              <Button
                className={css.submit}
                disabled={!canSubmit || isPending}
                icon='send-horizontal'
                isLoading={isPending}
                type='submit'
              >
                {t`Отправить`}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </Content>
    </form>
  )
}
