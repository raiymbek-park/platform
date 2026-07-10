import { expect, test } from 'vitest'

import { resolveLocale, translate } from './i18n'

test('error-states S2 — a missing x-locale header resolves to ru', () => {
  expect(resolveLocale(undefined)).toBe('ru')
})

test('error-states S3 — an unsupported x-locale value resolves to ru', () => {
  expect(resolveLocale('de')).toBe('ru')
})

test('resolveLocale accepts the supported locales and header arrays', () => {
  expect(resolveLocale('kk')).toBe('kk')
  expect(resolveLocale('en')).toBe('en')
  expect(resolveLocale(['kk', 'en'])).toBe('kk')
})

test('error-states S1 — a known error key is localized to the session locale', () => {
  expect(translate('ru', 'phoneNotVerified')).toBe('Телефон не подтверждён')
  expect(translate('kk', 'phoneNotVerified')).toBe('Телефон расталмаған')
  expect(translate('en', 'phoneNotVerified')).toBe('Phone is not verified')
})

test('error-states S4 — an unknown message key passes through unchanged', () => {
  expect(translate('kk', 'Some ad-hoc message')).toBe('Some ad-hoc message')
})

test('error-states 2: commentTranslateFailed is localized to the viewer’s locale', () => {
  expect(translate('ru', 'commentTranslateFailed')).toBe(
    'Не удалось перевести комментарий',
  )
  expect(translate('kk', 'commentTranslateFailed')).toBe(
    'Пікірді аудару мүмкін болмады',
  )
  expect(translate('en', 'commentTranslateFailed')).toBe(
    'Could not translate the comment',
  )
})
