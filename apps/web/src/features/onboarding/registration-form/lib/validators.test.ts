import type { RegistrationValues } from './validators'

import { expect, test } from 'vitest'

import { registrationSchema } from './validators'

const baseValues: RegistrationValues = {
  name: 'Алиса',
  phone: '+77071234567',
  block: 1,
  apartment: 42,
  role: 'owner',
}

const fieldError = (values: RegistrationValues, field: string) => {
  const result = registrationSchema.safeParse(values)
  if (result.success) return undefined
  return result.error.issues.find(issue => issue.path[0] === field)?.message
}

const withName = (name: string) => fieldError({ ...baseValues, name }, 'name')
const withApartment = (apartment: number, block: RegistrationValues['block']) =>
  fieldError({ ...baseValues, apartment, block }, 'apartment')

test('validation S10 — name of exactly 2 chars is valid', () => {
  expect(withName('Ab')).toBeUndefined()
})

test('validation S10 — name of exactly 1 char is invalid', () => {
  expect(withName('A')).toBeTruthy()
})

test('validation S11 — name of exactly 60 chars is valid', () => {
  expect(withName('A'.repeat(60))).toBeUndefined()
})

test('validation S11 — name of exactly 61 chars is invalid', () => {
  expect(withName('A'.repeat(61))).toBeTruthy()
})

test('validation S12 — whitespace-only name is invalid', () => {
  expect(withName('   ')).toBeTruthy()
})

test('validation S2 — trimmed name at 2 chars is valid', () => {
  expect(withName('  Ab  ')).toBeUndefined()
})

test('validation S2 — trimmed name at 1 char is invalid', () => {
  expect(withName('  A  ')).toBeTruthy()
})

test('validation S3 — full +7-prefixed number yields 10 local digits → valid', () => {
  expect(fieldError(baseValues, 'phone')).toBeUndefined()
})

test('validation S3 — phone with fewer than 10 local digits is invalid', () => {
  expect(
    fieldError({ ...baseValues, phone: '+7707123456' }, 'phone'),
  ).toBeTruthy()
})

test('validation S5 — null block is invalid', () => {
  expect(fieldError({ ...baseValues, block: null }, 'block')).toBeTruthy()
})

test('validation S5 — block 4 is valid', () => {
  expect(
    fieldError({ ...baseValues, apartment: 64, block: 4 }, 'block'),
  ).toBeUndefined()
})

test('validation S4 — empty (NaN) apartment is invalid', () => {
  expect(withApartment(Number.NaN, 1)).toBeTruthy()
})

test('validation S4 — apartment without a block is invalid', () => {
  expect(fieldError({ ...baseValues, block: null }, 'apartment')).toBeTruthy()
})

test('validation S13 block 1 — apartment 1/70 valid, 0/71 invalid', () => {
  expect(withApartment(1, 1)).toBeUndefined()
  expect(withApartment(70, 1)).toBeUndefined()
  expect(withApartment(0, 1)).toBeTruthy()
  expect(withApartment(71, 1)).toBeTruthy()
})

test('validation S13 block 2 — apartment 71/139 valid, 70/140 invalid', () => {
  expect(withApartment(71, 2)).toBeUndefined()
  expect(withApartment(139, 2)).toBeUndefined()
  expect(withApartment(70, 2)).toBeTruthy()
  expect(withApartment(140, 2)).toBeTruthy()
})

test('validation S13 block 3 — apartment 1/63 valid, 0/64 invalid', () => {
  expect(withApartment(1, 3)).toBeUndefined()
  expect(withApartment(63, 3)).toBeUndefined()
  expect(withApartment(0, 3)).toBeTruthy()
  expect(withApartment(64, 3)).toBeTruthy()
})

test('validation S13 block 4 — apartment 64/126 valid, 63/127 invalid', () => {
  expect(withApartment(64, 4)).toBeUndefined()
  expect(withApartment(126, 4)).toBeUndefined()
  expect(withApartment(63, 4)).toBeTruthy()
  expect(withApartment(127, 4)).toBeTruthy()
})

test('validation S5 — null role is invalid', () => {
  expect(fieldError({ ...baseValues, role: null }, 'role')).toBeTruthy()
})

test('validation S5 — tenant role is valid', () => {
  expect(fieldError({ ...baseValues, role: 'tenant' }, 'role')).toBeUndefined()
})
