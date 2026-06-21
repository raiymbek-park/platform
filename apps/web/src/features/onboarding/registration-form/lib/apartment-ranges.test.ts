import { expect, test } from 'vitest'

import { isApartmentInBlock } from './apartment-ranges'

// isApartmentInBlock — validation S4/S13 boundary checks

test('validation S13 block 1 — apartment 1 is within range', () => {
  expect(isApartmentInBlock(1, 1)).toBe(true)
})

test('validation S13 block 1 — apartment 70 is within range', () => {
  expect(isApartmentInBlock(1, 70)).toBe(true)
})

test('validation S13 block 1 — apartment 0 is out of range', () => {
  expect(isApartmentInBlock(1, 0)).toBe(false)
})

test('validation S13 block 1 — apartment 71 is out of range', () => {
  expect(isApartmentInBlock(1, 71)).toBe(false)
})

test('validation S13 block 2 — apartment 71 is within range', () => {
  expect(isApartmentInBlock(2, 71)).toBe(true)
})

test('validation S13 block 2 — apartment 139 is within range', () => {
  expect(isApartmentInBlock(2, 139)).toBe(true)
})

test('validation S13 block 2 — apartment 70 is out of range', () => {
  expect(isApartmentInBlock(2, 70)).toBe(false)
})

test('validation S13 block 2 — apartment 140 is out of range', () => {
  expect(isApartmentInBlock(2, 140)).toBe(false)
})

test('validation S13 block 3 — apartment 1 is within range', () => {
  expect(isApartmentInBlock(3, 1)).toBe(true)
})

test('validation S13 block 3 — apartment 63 is within range', () => {
  expect(isApartmentInBlock(3, 63)).toBe(true)
})

test('validation S13 block 3 — apartment 0 is out of range', () => {
  expect(isApartmentInBlock(3, 0)).toBe(false)
})

test('validation S13 block 3 — apartment 64 is out of range', () => {
  expect(isApartmentInBlock(3, 64)).toBe(false)
})

test('validation S13 block 4 — apartment 64 is within range', () => {
  expect(isApartmentInBlock(4, 64)).toBe(true)
})

test('validation S13 block 4 — apartment 126 is within range', () => {
  expect(isApartmentInBlock(4, 126)).toBe(true)
})

test('validation S13 block 4 — apartment 63 is out of range', () => {
  expect(isApartmentInBlock(4, 63)).toBe(false)
})

test('validation S13 block 4 — apartment 127 is out of range', () => {
  expect(isApartmentInBlock(4, 127)).toBe(false)
})
