import type { Issue } from '@raiymbek-park/api'
import type { ClassificationTag } from '@raiymbek-park/shared/validation-schemas'
import type { StatusFormValues } from '../lib/validators'

import { useLingui } from '@lingui/react/macro'
import { Content, ScreenHeader, ScreenTitle, Textarea } from '@raiymbek-park/ui'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'

import { inputState } from '@/shared/form'
import { FormDock } from '@/shared/issue'
import { MediaField, useMediaPicker } from '@/shared/media'

import { statusFormSchema } from '../lib/validators'
import { useChangeStatus } from '../model/use-change-status'
import { useStatusOptions } from '../model/use-status-options'
import { IssueSummary } from './issue-summary'
import css from './status-form.module.scss'
import { StatusSelect } from './status-select'
import { TagSelect } from './tag-select'

const toggleTag = (tags: ClassificationTag[], tag: ClassificationTag) =>
  tags.includes(tag)
    ? tags.filter(existing => existing !== tag)
    : [...tags, tag]

export type StatusFormProps = {
  issue: Issue
}

export const StatusForm = ({ issue }: StatusFormProps) => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const media = useMediaPicker()
  const { changeStatus, isPending } = useChangeStatus(issue.id)
  const options = useStatusOptions()
  const currentLabel = options.find(
    option => option.value === issue.status,
  )?.label

  const defaultValues: StatusFormValues = {
    comment: '',
    status: issue.status,
    tags: issue.tags,
  }

  const form = useForm({
    defaultValues,
    validators: { onChange: statusFormSchema },
    onSubmit: ({ value }) => {
      if (value.status === null) return
      changeStatus({
        comment: value.comment,
        files: media.files,
        status: value.status,
        tags: value.tags,
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
      <Content gap={24}>
        <ScreenTitle
          subtitle={t`Заявка №${issue.number} · ${currentLabel}`}
          title={t`Смена статуса`}
        />
        <IssueSummary issue={issue} />

        <form.Field name='tags'>
          {field => (
            <TagSelect
              value={field.state.value}
              onToggle={tag =>
                field.handleChange(toggleTag(field.state.value, tag))
              }
            />
          )}
        </form.Field>

        <form.Field name='status'>
          {field => (
            <StatusSelect
              value={field.state.value}
              onSelect={field.handleChange}
            />
          )}
        </form.Field>

        <MediaField label={t`Фото фиксация`} media={media} />

        <form.Field name='comment'>
          {field => (
            <Textarea
              label={t`Комментарий`}
              maxLength={1000}
              placeholder={t`Добавьте комментарий к смене статуса…`}
              state={inputState(field.state.meta)}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={event => field.handleChange(event.target.value)}
            />
          )}
        </form.Field>

        <form.Subscribe selector={state => state.canSubmit}>
          {canSubmit => (
            <FormDock
              backLabel={t`Отмена`}
              canSubmit={canSubmit}
              isPending={isPending}
              submitIcon='check'
              submitLabel={t`Сохранить`}
              onBack={goBack}
            />
          )}
        </form.Subscribe>
      </Content>
    </form>
  )
}
