import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { BlockCard } from './block-card'

test('renders as a button with its title', () => {
  render(<BlockCard title='Квартира' />)

  expect(screen.getByRole('button', { name: /Квартира/ })).toBeInTheDocument()
})

test('reflects the selected state via aria-pressed', () => {
  render(<BlockCard isSelected title='Квартира' />)

  expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
})

test('S5/S9 — aria-pressed is falsy when not selected', () => {
  render(<BlockCard title='Квартира' />)

  expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed', 'true')
})

test('stays selected when re-tapped (controlled, no internal toggle)', () => {
  const onClick = vi.fn()
  render(<BlockCard isSelected title='Квартира' onClick={onClick} />)

  fireEvent.click(screen.getByRole('button'))

  expect(onClick).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
})

test('can be disabled', () => {
  render(<BlockCard disabled title='Квартира' />)

  expect(screen.getByRole('button')).toBeDisabled()
})

test('forwards arbitrary attributes via rest props', () => {
  render(<BlockCard data-testid='card' title='Квартира' />)

  expect(screen.getByTestId('card')).toBeInTheDocument()
})
