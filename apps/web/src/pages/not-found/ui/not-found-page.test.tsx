import { screen } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import { firebaseAuth, renderApp } from '@/shared/test'

beforeEach(() => {
  firebaseAuth.reset()
  sessionStorage.clear()
})

test('an unknown top-level route shows the not-found page', async () => {
  renderApp('/totally-unknown')

  expect(await screen.findByText('Страница не найдена')).toBeInTheDocument()
})

test('an unknown route nested under a layout shows the not-found page, not a bare fallback', async () => {
  renderApp('/onboarding/welcomes')

  expect(await screen.findByText('Страница не найдена')).toBeInTheDocument()
})
