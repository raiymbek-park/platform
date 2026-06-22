import { phoneDigits } from '@raiymbek-park/api/contract'

export { normalizePhone } from '@raiymbek-park/api/contract'

export const formatPhoneMask = (value: string) => {
  const digits = phoneDigits(value)
  const area = digits.slice(0, 3)
  const prefix = digits.slice(3, 6)
  const lineA = digits.slice(6, 8)
  const lineB = digits.slice(8, 10)

  if (digits.length === 0) return '+7 '
  if (digits.length <= 3) return `+7 (${area}`
  if (digits.length <= 6) return `+7 (${area}) ${prefix}`
  if (digits.length <= 8) return `+7 (${area}) ${prefix}-${lineA}`
  return `+7 (${area}) ${prefix}-${lineA}-${lineB}`
}
