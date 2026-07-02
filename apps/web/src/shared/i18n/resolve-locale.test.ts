import { expect, test } from 'vitest'

import { resolveLocale } from './resolve-locale'

test('validation S1 — regional variants map to the base locale', () => {
  expect(resolveLocale('ru-RU')).toBe('ru')
  expect(resolveLocale('kk-KZ')).toBe('kk')
  expect(resolveLocale('en-US')).toBe('en')
  expect(resolveLocale('en-GB')).toBe('en')
})

test('validation S2 — mapping is case-insensitive', () => {
  expect(resolveLocale('EN')).toBe('en')
  expect(resolveLocale('en-us')).toBe('en')
  expect(resolveLocale('KK-KZ')).toBe('kk')
})

test('validation S3 — malformed or empty language falls back to ru', () => {
  expect(resolveLocale('')).toBe('ru')
  expect(resolveLocale('   ')).toBe('ru')
  expect(resolveLocale('!!')).toBe('ru')
})

test('validation S5 — unsupported languages fall back to ru', () => {
  expect(resolveLocale('fr-FR')).toBe('ru')
  expect(resolveLocale('de')).toBe('ru')
  expect(resolveLocale('zh-CN')).toBe('ru')
})

test('edge S1 — null or undefined language falls back to ru', () => {
  expect(resolveLocale(null)).toBe('ru')
  expect(resolveLocale(undefined)).toBe('ru')
})

test('supported locales resolve to themselves', () => {
  expect(resolveLocale('ru')).toBe('ru')
  expect(resolveLocale('kk')).toBe('kk')
  expect(resolveLocale('en')).toBe('en')
})
