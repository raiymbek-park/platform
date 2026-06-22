import { expect, test } from 'vitest'

import { cssVariables } from './css-variables'

test('prefixes each key with a -- custom-property marker', () => {
  expect(cssVariables({ progress: '50%' })).toEqual({ '--progress': '50%' })
})

test('converts camelCase keys to kebab-case', () => {
  expect(cssVariables({ trackColor: 'red' })).toEqual({
    '--track-color': 'red',
  })
})

test('preserves numeric values', () => {
  expect(cssVariables({ count: 3 })).toEqual({ '--count': 3 })
})

test('maps multiple variables at once', () => {
  expect(cssVariables({ progress: '50%', gap: 8 })).toEqual({
    '--progress': '50%',
    '--gap': 8,
  })
})

test('returns an empty object for no variables', () => {
  expect(cssVariables({})).toEqual({})
})
