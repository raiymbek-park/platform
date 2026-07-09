import { dateParts } from '@/shared/lib'

export const formatIssueDate = (ms: number, locale: string): string => {
  const value = dateParts(ms, locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const month = value('month')
  const capitalized = month.charAt(0).toUpperCase() + month.slice(1)
  return `${value('day')} ${capitalized} ${value('year')}`
}
