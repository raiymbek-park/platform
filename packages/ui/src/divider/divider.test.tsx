import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { Divider } from './divider'

test('renders a horizontal rule', () => {
  render(<Divider />)

  expect(screen.getByRole('separator')).toBeInTheDocument()
})

test('forwards arbitrary attributes via rest props', () => {
  render(<Divider data-testid='rule' />)

  expect(screen.getByTestId('rule')).toBeInTheDocument()
})
