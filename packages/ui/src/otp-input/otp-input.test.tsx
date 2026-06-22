import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { OtpInput } from './otp-input'

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
