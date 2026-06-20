import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { OtpInput } from './otp-input'

test('renders a numeric single-digit cell', () => {
  render(<OtpInput aria-label='cell' />)

  const cell = screen.getByLabelText('cell')

  expect(cell).toHaveAttribute('inputmode', 'numeric')
  expect(cell).toHaveAttribute('maxlength', '1')
})

test('emits only the digit and rejects non-digits', () => {
  const onChange = vi.fn()
  render(<OtpInput aria-label='cell' onChange={onChange} />)

  fireEvent.change(screen.getByLabelText('cell'), { target: { value: 'a' } })
  expect(onChange).toHaveBeenLastCalledWith('')

  fireEvent.change(screen.getByLabelText('cell'), { target: { value: '7' } })
  expect(onChange).toHaveBeenLastCalledWith('7')
})

test('S6 — emits the new digit when a digit replaces a filled cell', () => {
  const onChange = vi.fn()
  render(<OtpInput aria-label='cell' onChange={onChange} />)

  fireEvent.change(screen.getByLabelText('cell'), { target: { value: '35' } })
  expect(onChange).toHaveBeenLastCalledWith('5')
})

test('applies the error state class', () => {
  const { container } = render(<OtpInput aria-label='cell' state='error' />)

  expect(container.querySelector('input')?.className).toContain('StateError')
})

test('forwards arbitrary attributes via rest props', () => {
  render(<OtpInput data-testid='otp-1' />)

  expect(screen.getByTestId('otp-1')).toBeInTheDocument()
})
