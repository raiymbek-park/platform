import { TRPCError } from '@trpc/server'

import type { Resident } from './session-store'

export type SendInput = { phone: string }
export type StatusInput = { phone: string }
export type VerifyInput = { code: string; phone: string }
export type RegisterInput = Resident
export type RefreshInput = { refreshToken: string }

const badRequest = (message: string) =>
  new TRPCError({ code: 'BAD_REQUEST', message })

const asRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw badRequest('Expected an object input')
  }
  return { ...value }
}

const readString = (source: Record<string, unknown>, key: string): string => {
  const value = source[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw badRequest(`Missing or invalid field: ${key}`)
  }
  return value
}

const readPositiveInt = (
  source: Record<string, unknown>,
  key: string,
): number => {
  const value = source[key]
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw badRequest(`Field ${key} must be a positive integer`)
  }
  return parsed
}

const normalizePhone = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  const local = digits.startsWith('8') ? `7${digits.slice(1)}` : digits
  if (local.length !== 11 || !local.startsWith('7')) {
    throw badRequest('Phone must be +7 followed by 10 digits')
  }
  return `+${local}`
}

export const parseSendInput = (value: unknown): SendInput => ({
  phone: normalizePhone(readString(asRecord(value), 'phone')),
})

export const parseStatusInput = (value: unknown): StatusInput => ({
  phone: normalizePhone(readString(asRecord(value), 'phone')),
})

export const parseVerifyInput = (value: unknown): VerifyInput => {
  const source = asRecord(value)
  const code = readString(source, 'code')
  if (!/^\d{4}$/.test(code)) {
    throw badRequest('Code must be 4 digits')
  }
  return { code, phone: normalizePhone(readString(source, 'phone')) }
}

export const parseRegisterInput = (value: unknown): RegisterInput => {
  const source = asRecord(value)
  return {
    apartment: readPositiveInt(source, 'apartment'),
    block: readString(source, 'block'),
    name: readString(source, 'name'),
    phone: normalizePhone(readString(source, 'phone')),
    role: readString(source, 'role'),
  }
}

export const parseRefreshInput = (value: unknown): RefreshInput => ({
  refreshToken: readString(asRecord(value), 'refreshToken'),
})
