import { i18n } from '@lingui/core'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { bootstrapLocale } from './bootstrap-locale'

const setNavigatorLanguage = (value: string | undefined) => {
  Object.defineProperty(navigator, 'language', { configurable: true, value })
}

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

test('happy-path S1 — detects and activates the browser language without persisting when none is stored', async () => {
  setNavigatorLanguage('kk-KZ')

  const locale = await bootstrapLocale()

  expect(locale).toBe('kk')
  expect(localStorage.getItem('locale')).toBeNull()
  expect(i18n.locale).toBe('kk')
})

test('happy-path S2 — falls back to ru for an unsupported browser language', async () => {
  setNavigatorLanguage('fr-FR')

  const locale = await bootstrapLocale()

  expect(locale).toBe('ru')
  expect(localStorage.getItem('locale')).toBeNull()
})

test('happy-path S3 — a persisted locale wins over the browser language', async () => {
  localStorage.setItem('locale', 'en')
  setNavigatorLanguage('kk-KZ')

  const locale = await bootstrapLocale()

  expect(locale).toBe('en')
  expect(i18n.locale).toBe('en')
})

test('validation S4 — an invalid stored value is ignored and the browser language is re-detected', async () => {
  localStorage.setItem('locale', 'de')
  setNavigatorLanguage('kk-KZ')

  const locale = await bootstrapLocale()

  expect(locale).toBe('kk')
  expect(localStorage.getItem('locale')).toBe('de')
})
