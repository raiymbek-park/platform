import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { i18n } from '@lingui/core'
import { afterEach, expect, test } from 'vitest'

import { activateLocale } from './activate-locale'
import { DEFAULT_LOCALE } from './config'

const readShell = () => {
  const testDir = dirname(expect.getState().testPath ?? '')
  return readFileSync(resolve(testDir, '../../../index.html'), 'utf8')
}

afterEach(() => {
  document.documentElement.lang = DEFAULT_LOCALE
  i18n.loadAndActivate({ locale: DEFAULT_LOCALE, messages: {} })
})

test('happy-path S9 — activating a locale declares it on the document', async () => {
  await activateLocale('en')

  expect(document.documentElement.lang).toBe('en')
  expect(i18n.locale).toBe('en')
})

test('happy-path S9 — a later switch re-declares the new locale', async () => {
  await activateLocale('en')
  await activateLocale('kk')

  expect(document.documentElement.lang).toBe('kk')
})

test('edge-cases S7 — the static page shell declares the default locale', () => {
  expect(readShell()).toContain(`<html lang="${DEFAULT_LOCALE}"`)
})

test('edge-cases S8 — the page shell does not opt out of browser translation', () => {
  const shell = readShell()

  expect(shell).not.toContain('notranslate')
  expect(shell).not.toContain('translate=')
})
