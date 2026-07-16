export const formatPhoneDisplay = (normalizedPhone: string) => {
  const digits = normalizedPhone.replace(/\D/g, '').slice(-10)
  if (digits === '') return ''
  const area = digits.slice(0, 3)
  const prefix = digits.slice(3, 6)
  const lineA = digits.slice(6, 8)
  const lineB = digits.slice(8, 10)
  return `+7 ${area} ${prefix} ${lineA} ${lineB}`.trimEnd()
}
