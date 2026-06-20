import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { Input } from './input'

test('renders a text field that forwards native props', () => {
  render(<Input placeholder='Имя' />)

  expect(screen.getByPlaceholderText('Имя')).toBeInTheDocument()
})

test('renders the leading icon when provided', () => {
  const { container } = render(<Input icon='user' />)

  expect(container.querySelector('[data-glyph="user"]')).not.toBeNull()
})

test('applies the error state class', () => {
  const { container } = render(<Input state='error' />)

  expect(container.querySelector('label')?.className).toContain('StateError')
})

test('forwards arbitrary attributes via rest props', () => {
  render(<Input data-testid='name-input' />)

  expect(screen.getByTestId('name-input')).toBeInTheDocument()
})
