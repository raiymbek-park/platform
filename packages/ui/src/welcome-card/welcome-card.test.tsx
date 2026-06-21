import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { WelcomeCard } from './welcome-card'

test('renders the title as a heading', () => {
  render(<WelcomeCard title='Добро пожаловать' />)

  expect(
    screen.getByRole('heading', { name: 'Добро пожаловать' }),
  ).toBeInTheDocument()
})

test('renders description and icon when provided', () => {
  const { container } = render(
    <WelcomeCard description='Заполните профиль' icon='user' title='Привет' />,
  )

  expect(screen.getByText('Заполните профиль')).toBeInTheDocument()
  expect(container.querySelector('[data-glyph="user"]')).not.toBeNull()
})

test('renders children', () => {
  render(
    <WelcomeCard title='Привет'>
      <span>Контент</span>
    </WelcomeCard>,
  )

  expect(screen.getByText('Контент')).toBeInTheDocument()
})

test('forwards arbitrary attributes via rest props', () => {
  render(<WelcomeCard data-testid='welcome' title='Привет' />)

  expect(screen.getByTestId('welcome')).toBeInTheDocument()
})
