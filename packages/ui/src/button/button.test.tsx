import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { Button } from './button'

test('renders its label as a button', () => {
  render(<Button>Далее</Button>)

  expect(screen.getByRole('button', { name: 'Далее' })).toBeInTheDocument()
})

test('renders the requested icon', () => {
  const { container } = render(<Button icon='arrow-right'>Далее</Button>)

  expect(container.querySelector('[data-glyph="arrow-right"]')).not.toBeNull()
})

test('becomes disabled and shows a spinner while loading', () => {
  const { container } = render(<Button isLoading>Далее</Button>)

  expect(screen.getByRole('button')).toBeDisabled()
  expect(container.querySelector('[data-glyph="loader-circle"]')).not.toBeNull()
})
