const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (ms: number): number => {
  const date = new Date(ms)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

type RelativeLabels = {
  today: string
  yesterday: string
}

export const formatPostDate = (
  ms: number,
  locale: string,
  labels: RelativeLabels,
): string => {
  const days = Math.round((startOfDay(Date.now()) - startOfDay(ms)) / DAY_MS)
  if (days <= 0) return labels.today
  if (days === 1) return labels.yesterday

  const parts = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
  }).formatToParts(new Date(ms))
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''
  return `${value('day')} ${value('month')}`
}
