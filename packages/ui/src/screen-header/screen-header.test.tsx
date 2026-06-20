import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { ScreenHeader } from './screen-header'

test('renders the title as a top-level heading', () => {
  render(<ScreenHeader title='Подтверждение' />)

  expect(
    screen.getByRole('heading', { level: 1, name: 'Подтверждение' }),
  ).toBeInTheDocument()
})

test('renders the back-action slot', () => {
  render(
    <ScreenHeader
      backAction={<button type='button'>Назад</button>}
      title='Подтверждение'
    />,
  )

  expect(screen.getByRole('button', { name: 'Назад' })).toBeInTheDocument()
})

test('forwards arbitrary attributes via rest props', () => {
  render(<ScreenHeader data-testid='top-bar' />)

  expect(screen.getByTestId('top-bar')).toBeInTheDocument()
})
