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

test('forwards arbitrary attributes via rest props', () => {
  render(<OtpInput data-testid='otp-1' />)

  expect(screen.getByTestId('otp-1')).toBeInTheDocument()
})
