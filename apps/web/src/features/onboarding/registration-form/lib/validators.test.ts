import { expect, test } from 'vitest'

import {
  validateApartment,
  validateBlock,
  validateName,
  validatePhone,
  validateRole,
} from './validators'

// validateName — validation S2/S10/S11/S12

test('validation S10 — name of exactly 2 chars is valid', () => {
  expect(validateName('Ab')).toBeUndefined()
})

test('validation S10 — name of exactly 1 char is invalid', () => {
  expect(validateName('A')).toBeTruthy()
})

test('validation S11 — name of exactly 60 chars is valid', () => {
  expect(validateName('A'.repeat(60))).toBeUndefined()
})

test('validation S11 — name of exactly 61 chars is invalid', () => {
  expect(validateName('A'.repeat(61))).toBeTruthy()
})

test('validation S12 — whitespace-only name is invalid', () => {
  expect(validateName('   ')).toBeTruthy()
})

test('validation S2 — trimmed name at 2 chars is valid', () => {
  expect(validateName('  Ab  ')).toBeUndefined()
})

test('validation S2 — trimmed name at 1 char is invalid', () => {
  expect(validateName('  A  ')).toBeTruthy()
})

// validatePhone — validation S3
// phoneDigits strips leading 8 (trunk) then leading 7 (country code).
// A full +7XXXXXXXXXX number yields 10 local digits → valid.

test('validation S3 — full +7-prefixed number yields 10 local digits → valid', () => {
  expect(validatePhone('+77071234567')).toBeUndefined()
})

test('validation S3 — full 11-digit number without plus yields 10 local digits → valid', () => {
  expect(validatePhone('77071234567')).toBeUndefined()
})

test('validation S3 — phone with fewer than 10 local digits is invalid', () => {
  expect(validatePhone('+7707123456')).toBeTruthy()
})

// validateBlock — validation S5

test('validation S5 — null block is invalid', () => {
  expect(validateBlock(null)).toBeTruthy()
})

test('validation S5 — block 1 is valid', () => {
  expect(validateBlock(1)).toBeUndefined()
})

test('validation S5 — block 4 is valid', () => {
  expect(validateBlock(4)).toBeUndefined()
})

// validateApartment — validation S4/S13

test('validation S4 — non-numeric apartment is invalid', () => {
  expect(validateApartment('abc', 1)).toBeTruthy()
})

test('validation S4 — empty apartment is invalid', () => {
  expect(validateApartment('', 1)).toBeTruthy()
})

test('validation S4 — apartment without a block is invalid', () => {
  expect(validateApartment('10', null)).toBeTruthy()
})

test('validation S13 block 1 — apartment 1 (first valid) is valid', () => {
  expect(validateApartment('1', 1)).toBeUndefined()
})

test('validation S13 block 1 — apartment 70 (last valid) is valid', () => {
  expect(validateApartment('70', 1)).toBeUndefined()
})

test('validation S13 block 1 — apartment 71 (one above last) is invalid', () => {
  expect(validateApartment('71', 1)).toBeTruthy()
})

test('validation S13 block 1 — apartment 0 (one below first) is invalid', () => {
  expect(validateApartment('0', 1)).toBeTruthy()
})

test('validation S13 block 2 — apartment 71 (first valid) is valid', () => {
  expect(validateApartment('71', 2)).toBeUndefined()
})

test('validation S13 block 2 — apartment 139 (last valid) is valid', () => {
  expect(validateApartment('139', 2)).toBeUndefined()
})

test('validation S13 block 2 — apartment 140 (one above last) is invalid', () => {
  expect(validateApartment('140', 2)).toBeTruthy()
})

test('validation S13 block 2 — apartment 70 (one below first) is invalid', () => {
  expect(validateApartment('70', 2)).toBeTruthy()
})

test('validation S13 block 3 — apartment 1 (first valid) is valid', () => {
  expect(validateApartment('1', 3)).toBeUndefined()
})

test('validation S13 block 3 — apartment 63 (last valid) is valid', () => {
  expect(validateApartment('63', 3)).toBeUndefined()
})

test('validation S13 block 3 — apartment 64 (one above last) is invalid', () => {
  expect(validateApartment('64', 3)).toBeTruthy()
})

test('validation S13 block 3 — apartment 0 (one below first) is invalid', () => {
  expect(validateApartment('0', 3)).toBeTruthy()
})

test('validation S13 block 4 — apartment 64 (first valid) is valid', () => {
  expect(validateApartment('64', 4)).toBeUndefined()
})

test('validation S13 block 4 — apartment 126 (last valid) is valid', () => {
  expect(validateApartment('126', 4)).toBeUndefined()
})

test('validation S13 block 4 — apartment 127 (one above last) is invalid', () => {
  expect(validateApartment('127', 4)).toBeTruthy()
})

test('validation S13 block 4 — apartment 63 (one below first) is invalid', () => {
  expect(validateApartment('63', 4)).toBeTruthy()
})

// validateRole — validation S5

test('validation S5 — null role is invalid', () => {
  expect(validateRole(null)).toBeTruthy()
})

test('validation S5 — owner role is valid', () => {
  expect(validateRole('owner')).toBeUndefined()
})

test('validation S5 — tenant role is valid', () => {
  expect(validateRole('tenant')).toBeUndefined()
})
