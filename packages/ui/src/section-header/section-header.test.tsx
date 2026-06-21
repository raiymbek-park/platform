import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { SectionHeader } from './section-header'

test('renders the title as a heading', () => {
  render(<SectionHeader title='Контакты' />)

  expect(screen.getByRole('heading', { name: 'Контакты' })).toBeInTheDocument()
})

test('renders the subtitle when provided', () => {
  render(<SectionHeader subtitle='Укажите данные' title='Контакты' />)

  expect(screen.getByText('Укажите данные')).toBeInTheDocument()
})

test('omits the subtitle when not provided', () => {
  render(<SectionHeader title='Контакты' />)

  expect(screen.queryByText('Укажите данные')).not.toBeInTheDocument()
})

test('forwards arbitrary attributes via rest props', () => {
  render(<SectionHeader data-testid='header' title='Контакты' />)

  expect(screen.getByTestId('header')).toBeInTheDocument()
})
