import { afterEach, beforeEach, expect, test } from 'vitest'

import { persistLocale, readStoredLocale } from './locale-storage'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

test('readStoredLocale returns null when nothing is stored', () => {
  expect(readStoredLocale()).toBeNull()
})

test('a valid stored locale is returned', () => {
  localStorage.setItem('locale', 'en')
  expect(readStoredLocale()).toBe('en')
})

test('validation S4 — an invalid stored value is treated as absent', () => {
  localStorage.setItem('locale', 'de')
  expect(readStoredLocale()).toBeNull()
})

test('persistLocale writes the locale to localStorage', () => {
  persistLocale('kk')
  expect(localStorage.getItem('locale')).toBe('kk')
})
