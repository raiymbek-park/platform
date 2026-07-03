import type { IssueCategory } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { issueCreateInputSchema } from '@raiymbek-park/shared/validation-schemas'
import { useState } from 'react'

type Field = 'category' | 'description' | 'title'

type FormErrors = Partial<Record<Field, string>>

type IssueFormValues = {
  category: IssueCategory
  description: string
  title: string
  urgent: boolean
}

const isField = (value: string): value is Field =>
  value === 'category' || value === 'description' || value === 'title'

export const useIssueForm = () => {
  const { t } = useLingui()
  const [category, setCategory] = useState<IssueCategory | null>(null)
  const [urgent, setUrgent] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const messageFor: Record<Field, string> = {
    category: t`Выберите категорию`,
    description: t`Описание должно содержать от 10 до 1000 символов`,
    title: t`Тема заявки должна содержать от 3 до 80 символов`,
  }

  const validate = (): IssueFormValues | null => {
    const result = issueCreateInputSchema.safeParse({
      category,
      description,
      media: [],
      title,
      urgent,
    })
    if (result.success) {
      setErrors({})
      const { category: value, description, title } = result.data
      return { category: value, description, title, urgent }
    }
    const next: FormErrors = {}
    result.error.issues.forEach(issue => {
      const field = issue.path[0]
      if (typeof field === 'string' && isField(field))
        next[field] = messageFor[field]
    })
    setErrors(next)
    return null
  }

  return {
    category,
    description,
    errors,
    setCategory: (value: IssueCategory) => setCategory(value),
    setDescription,
    setTitle,
    title,
    toggleUrgent: () => setUrgent(value => !value),
    urgent,
    validate,
  }
}
