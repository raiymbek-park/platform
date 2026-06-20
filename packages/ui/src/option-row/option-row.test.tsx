import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { OptionRow } from './option-row'

test('renders as a button with its label', () => {
  render(<OptionRow label='Русский' />)

  expect(screen.getByRole('button', { name: /Русский/ })).toBeInTheDocument()
})

test('shows the check glyph and aria-pressed when selected', () => {
  const { container } = render(<OptionRow isSelected label='Русский' />)

  expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  expect(container.querySelector('[data-glyph="check"]')).not.toBeNull()
})

test('stays selected when re-tapped (controlled, no internal toggle)', () => {
  const onClick = vi.fn()
  render(<OptionRow isSelected label='Русский' onClick={onClick} />)

  fireEvent.click(screen.getByRole('button'))

  expect(onClick).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
})

test('forwards arbitrary attributes via rest props', () => {
  render(<OptionRow data-testid='option' label='Русский' />)

  expect(screen.getByTestId('option')).toBeInTheDocument()
})
