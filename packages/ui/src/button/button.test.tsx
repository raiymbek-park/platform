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

test('applies the secondary variant class', () => {
  render(<Button variant='secondary'>Отмена</Button>)

  expect(screen.getByRole('button').className).toContain('VariantSecondary')
})

test('S8 — secondary variant button is enabled and shows no spinner by default', () => {
  render(<Button variant='secondary'>Повторить</Button>)

  const btn = screen.getByRole('button', { name: 'Повторить' })
  expect(btn).not.toBeDisabled()
  expect(btn.querySelector('[data-glyph="loader-circle"]')).toBeNull()
})

test('forwards arbitrary attributes via rest props', () => {
  render(<Button data-testid='next-btn'>Далее</Button>)

  expect(screen.getByTestId('next-btn')).toBeInTheDocument()
})
