import { CODE_LENGTH } from './constants'

const SEGMENT = CODE_LENGTH / 2

export const otpMask = 'xxx - xxx'

export const toDigits = (value: string) =>
  value.replace(/\D/g, '').slice(0, CODE_LENGTH)

export const formatOtp = (digits: string) => {
  const head = digits.slice(0, SEGMENT)
  const tail = digits.slice(SEGMENT)
  return tail ? `${head} - ${tail}` : head
}
