export const dateParts = (
  ms: number,
  locale: string,
  options: Intl.DateTimeFormatOptions,
) => {
  const parts = new Intl.DateTimeFormat(locale, options).formatToParts(
    new Date(ms),
  )
  return (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''
}
