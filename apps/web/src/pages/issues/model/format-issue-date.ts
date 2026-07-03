export const formatIssueDate = (ms: number, locale: string): string => {
  const parts = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(new Date(ms))

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''

  const month = value('month')
  const capitalized = month.charAt(0).toUpperCase() + month.slice(1)
  return `${value('day')} ${capitalized} ${value('year')}`
}
