import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto'

export const generateCode = (): string =>
  String(randomInt(0, 1_000_000)).padStart(6, '0')

export const newSalt = (): string => randomBytes(16).toString('hex')

export const hashCode = (salt: string, code: string): string =>
  createHash('sha256')
    .update(salt + code)
    .digest('hex')

export const isCodeMatch = (
  salt: string,
  codeHash: string,
  code: string,
): boolean => {
  const stored = Buffer.from(codeHash, 'hex')
  const submitted = Buffer.from(hashCode(salt, code), 'hex')
  return (
    stored.length === submitted.length && timingSafeEqual(stored, submitted)
  )
}
