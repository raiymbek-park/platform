import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { bootstrapLocale } from '@/shared/i18n'
import { firebaseAuth, renderApp } from '@/shared/test'

const setNavigatorLanguage = (value: string | undefined) => {
  Object.defineProperty(navigator, 'language', { configurable: true, value })
}

const boot = async (navigatorLanguage: string | undefined) => {
  setNavigatorLanguage(navigatorLanguage)
  await bootstrapLocale()
}

beforeEach(() => {
  firebaseAuth.reset()
  localStorage.clear()
})

afterEach(() => localStorage.clear())

test('happy-path S1 — first launch pre-selects the detected Kazakh locale and persists nothing', async () => {
  await boot('kk-KZ')

  renderApp('/onboarding/language')

  expect(
    await screen.findByRole('heading', { name: 'Тілді таңдаңыз' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Қазақша/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('button', { name: 'Келесі' })).toBeInTheDocument()
  expect(localStorage.getItem('locale')).toBeNull()
})

test('happy-path S2 — an unsupported browser language pre-selects Russian', async () => {
  await boot('fr-FR')

  renderApp('/onboarding/language')

  expect(
    await screen.findByRole('heading', { name: 'Выберите язык' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Русский/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(localStorage.getItem('locale')).toBeNull()
})

test('happy-path S3 — confirming the pre-selected default persists it and continues to welcome', async () => {
  await boot('ru-RU')
  const { user, currentPath } = renderApp('/onboarding/language')

  await user.click(await screen.findByRole('button', { name: 'Далее' }))

  await waitFor(() => expect(currentPath()).toBe('/onboarding/welcome'))
  expect(localStorage.getItem('locale')).toBe('ru')
})

test('happy-path S4 — choosing a different language activates it live and persists it on confirm', async () => {
  await boot('ru-RU')
  const { user, currentPath } = renderApp('/onboarding/language')

  await screen.findByRole('heading', { name: 'Выберите язык' })
  await user.click(screen.getByRole('button', { name: /English/ }))

  expect(
    await screen.findByRole('heading', { name: 'Select a language' }),
  ).toBeInTheDocument()
  expect(localStorage.getItem('locale')).toBeNull()

  await user.click(screen.getByRole('button', { name: 'Next' }))

  await waitFor(() => expect(currentPath()).toBe('/onboarding/welcome'))
  expect(localStorage.getItem('locale')).toBe('en')
})

test('happy-path S5 — a stored choice skips the selection screen and renders in the stored language', async () => {
  localStorage.setItem('locale', 'en')
  await boot('kk-KZ')

  const { currentPath } = renderApp('/onboarding/')

  await waitFor(() => expect(currentPath()).toBe('/onboarding/welcome'))
  expect(await screen.findByLabelText('Name')).toBeInTheDocument()
})

test('validation S4 — an invalid stored value is ignored, re-detected, and not persisted', async () => {
  localStorage.setItem('locale', 'de')
  await boot('kk-KZ')

  renderApp('/onboarding/language')

  expect(
    await screen.findByRole('heading', { name: 'Тілді таңдаңыз' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Қазақша/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(localStorage.getItem('locale')).toBe('de')
})

test('happy-path S9 — switching the language re-declares the document language without a reload', async () => {
  await boot('ru-RU')
  const { user } = renderApp('/onboarding/language')

  await screen.findByRole('heading', { name: 'Выберите язык' })
  expect(document.documentElement.lang).toBe('ru')

  await user.click(screen.getByRole('button', { name: /English/ }))

  await screen.findByRole('heading', { name: 'Select a language' })
  expect(document.documentElement.lang).toBe('en')
})

test('validation S6 — tapping an option marks it selected and unmarks the previous one', async () => {
  await boot('ru-RU')
  const { user } = renderApp('/onboarding/language')

  const russian = await screen.findByRole('button', { name: /Русский/ })
  const kazakh = screen.getByRole('button', { name: /Қазақша/ })
  expect(russian).toHaveAttribute('aria-pressed', 'true')
  expect(kazakh).toHaveAttribute('aria-pressed', 'false')

  await user.click(kazakh)

  expect(kazakh).toHaveAttribute('aria-pressed', 'true')
  expect(russian).toHaveAttribute('aria-pressed', 'false')
})

test('validation S7 — switching the selection re-renders live before confirming, without persisting', async () => {
  await boot('ru-RU')
  const { user } = renderApp('/onboarding/language')

  await screen.findByRole('heading', { name: 'Выберите язык' })
  await user.click(screen.getByRole('button', { name: /Қазақша/ }))

  expect(
    await screen.findByRole('heading', { name: 'Тілді таңдаңыз' }),
  ).toBeInTheDocument()
  expect(localStorage.getItem('locale')).toBeNull()
})

test('edge-cases S5 — navigator.language undefined pre-selects Russian', async () => {
  await boot(undefined)

  renderApp('/onboarding/language')

  expect(
    await screen.findByRole('heading', { name: 'Выберите язык' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Русский/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('edge-cases S6 — reaching welcome with no stored language choice redirects to the language screen', async () => {
  const { currentPath } = renderApp('/onboarding/welcome')

  await waitFor(() => expect(currentPath()).toBe('/onboarding/language'))
})

test('route guard — onboarding index routes to the language screen when no choice is stored', async () => {
  const { currentPath } = renderApp('/onboarding/')

  await waitFor(() => expect(currentPath()).toBe('/onboarding/language'))
})

test('route guard — onboarding index routes to welcome when a choice is stored', async () => {
  localStorage.setItem('locale', 'kk')

  const { currentPath } = renderApp('/onboarding/')

  await waitFor(() => expect(currentPath()).toBe('/onboarding/welcome'))
})
