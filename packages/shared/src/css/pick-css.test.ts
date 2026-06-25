import { expect, test } from 'vitest'

import { pickCss } from './pick-css'

const css = {
  button: 'button_h',
  buttonIsLoading: 'is-loading_h',
  buttonStateError: 'state-error_h',
  buttonStateSuccess: 'state-success_h',
  buttonSizeLg: 'size-lg_h',
}

const buttonCss = pickCss(css, css.button)

test('returns only the root class when no props are active', () => {
  expect(buttonCss()).toBe('button_h')
})

test('appends the state class for a boolean true prop', () => {
  expect(buttonCss({ isLoading: true })).toBe('button_h is-loading_h')
})

test('skips boolean false and undefined props', () => {
  expect(buttonCss({ isLoading: false, isDisabled: undefined })).toBe(
    'button_h',
  )
})

test('appends a value-suffixed class for a string prop', () => {
  expect(buttonCss({ state: 'error' })).toBe('button_h state-error_h')
})

test('skips empty-string prop values', () => {
  expect(buttonCss({ state: '' })).toBe('button_h')
})

test('converts camelCase prop names to kebab-case lookups', () => {
  expect(buttonCss({ size: 'lg' })).toBe('button_h size-lg_h')
})

test('combines multiple active props with the root class', () => {
  expect(buttonCss({ isLoading: true, state: 'success' })).toBe(
    'button_h is-loading_h state-success_h',
  )
})

test('appends extra classes and drops falsy ones', () => {
  expect(buttonCss({}, 'extra', undefined)).toBe('button_h extra')
})

test('omits state classes that do not exist in the module', () => {
  expect(buttonCss({ isMissing: true })).toBe('button_h')
})

test('yields an empty string when the root value is undefined', () => {
  expect(pickCss(css, undefined)()).toBe('')
})
