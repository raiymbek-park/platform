import { afterEach, beforeEach, expect, test } from 'vitest'

import {
  hasLocaleChoice,
  persistLocale,
  readStoredLocale,
} from './locale-storage'

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

test('hasLocaleChoice is false with nothing stored and true once a valid locale is stored', () => {
  expect(hasLocaleChoice()).toBe(false)

  localStorage.setItem('locale', 'en')

  expect(hasLocaleChoice()).toBe(true)
})

test('hasLocaleChoice is false for an invalid stored value', () => {
  localStorage.setItem('locale', 'de')

  expect(hasLocaleChoice()).toBe(false)
})
