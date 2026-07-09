export const formatCommentTime = (ms: number, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms))
