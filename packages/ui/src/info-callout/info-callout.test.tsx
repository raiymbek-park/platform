import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { InfoCallout } from './info-callout'

test('renders the message', () => {
  render(<InfoCallout>Проверьте номер</InfoCallout>)

  expect(screen.getByText('Проверьте номер')).toBeInTheDocument()
})

test('defaults to the info variant', () => {
  const { container } = render(<InfoCallout>Инфо</InfoCallout>)

  expect(container.querySelector('aside')?.className).toContain('VariantInfo')
})

test('applies the warning variant with its default glyph', () => {
  const { container } = render(
    <InfoCallout variant='warning'>Внимание</InfoCallout>,
  )

  expect(container.querySelector('aside')?.className).toContain(
    'VariantWarning',
  )
  expect(container.querySelector('[data-glyph="zap"]')).not.toBeNull()
})

test('forwards arbitrary attributes via rest props', () => {
  render(<InfoCallout data-testid='callout'>Инфо</InfoCallout>)

  expect(screen.getByTestId('callout')).toBeInTheDocument()
})
