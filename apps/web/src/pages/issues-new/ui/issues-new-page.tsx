import type { FormEvent } from 'react'

import { useLingui } from '@lingui/react/macro'
import {
  Button,
  Content,
  ImageForm,
  InfoCallout,
  Input,
  ScreenFooter,
  ScreenHeader,
  Textarea,
} from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { uploadIssueMedia } from '../model/upload-media'
import { useCreateIssue } from '../model/use-create-issue'
import { useIssueForm } from '../model/use-issue-form'
import { useMediaPicker } from '../model/use-media-picker'
import { CategoryField } from './category-field'
import css from './issues-new-page.module.scss'

export const IssuesNewPage = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const form = useIssueForm()
  const media = useMediaPicker()
  const { createIssue } = useCreateIssue()
  const [isSubmitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const goBack = () => navigate({ search: { status: 'new' }, to: '/issues' })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)
    const values = form.validate()
    if (!values || media.error) return

    setSubmitting(true)
    const uploaded = await uploadIssueMedia(media.files).catch(() => null)
    if (uploaded === null) {
      setSubmitError(t`Не удалось загрузить файлы. Попробуйте ещё раз.`)
      setSubmitting(false)
      return
    }

    try {
      await createIssue({ ...values, media: uploaded })
    } catch {
      setSubmitError(t`Не удалось создать заявку. Попробуйте ещё раз.`)
      setSubmitting(false)
    }
  }

  return (
    <form className={css.form} onSubmit={handleSubmit}>
      <ScreenHeader />
      <Content gap={24}>
        <img
          alt=''
          className={css.illustration}
          src={`${import.meta.env.BASE_URL}images/create-issue.png`}
        />
        <header className={css.intro}>
          <h1 className={css.title}>{t`Новая заявка`}</h1>
          <p className={css.subtitle}>
            {t`Опишите проблему или вопрос, который вы хотите направить управляющей компании или жителям нашего ЖК.`}
          </p>
        </header>

        <CategoryField
          category={form.category}
          error={form.errors.category}
          urgent={form.urgent}
          onSelect={form.setCategory}
          onToggleUrgent={form.toggleUrgent}
        />

        <div className={css.field}>
          <Input
            icon='hammer'
            label={t`Тема заявки`}
            maxLength={80}
            placeholder={t`Кратко опишите проблему`}
            state={form.errors.title ? 'error' : undefined}
            value={form.title}
            onChange={event => form.setTitle(event.target.value)}
          />
          {form.errors.title && (
            <span className={css.error}>{form.errors.title}</span>
          )}
        </div>

        <div className={css.field}>
          <Textarea
            label={t`Описание`}
            maxLength={1000}
            placeholder={t`Подробно опишите, что случилось и где…`}
            state={form.errors.description ? 'error' : undefined}
            value={form.description}
            onChange={event => form.setDescription(event.target.value)}
          />
          {form.errors.description && (
            <span className={css.error}>{form.errors.description}</span>
          )}
        </div>

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
          {media.error && <span className={css.error}>{media.error}</span>}
        </div>

        {submitError && (
          <InfoCallout icon='circle-alert' variant='danger'>
            {submitError}
          </InfoCallout>
        )}
      </Content>

      <ScreenFooter className={css.footer}>
        <div className={css.dock}>
          <Button
            aria-label={t`Назад`}
            icon='arrow-left'
            type='button'
            variant='icon'
            onClick={goBack}
          />
          <Button
            className={css.submit}
            icon='send-horizontal'
            isLoading={isSubmitting}
            type='submit'
          >
            {t`Отправить`}
          </Button>
        </div>
      </ScreenFooter>
    </form>
  )
}
