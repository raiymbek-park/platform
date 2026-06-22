import { expect, test } from 'vitest'

import { toCamel, toKebab } from './case'

test('toKebab inserts a hyphen before each uppercase letter and lowercases it', () => {
  expect(toKebab('isLoading')).toBe('is-loading')
})

test('toKebab leaves an all-lowercase word unchanged', () => {
  expect(toKebab('button')).toBe('button')
})

test('toKebab handles several humps', () => {
  expect(toKebab('buttonSizeLg')).toBe('button-size-lg')
})

test('toCamel removes hyphens and uppercases the following letter', () => {
  expect(toCamel('is-loading')).toBe('isLoading')
})

test('toCamel handles several segments', () => {
  expect(toCamel('button-state-error')).toBe('buttonStateError')
})

test('toCamel collapses a hyphen before a digit', () => {
  expect(toCamel('grid-2')).toBe('grid2')
})

test('toKebab and toCamel round-trip a camelCase name', () => {
  expect(toCamel(toKebab('buttonIsLoading'))).toBe('buttonIsLoading')
})
