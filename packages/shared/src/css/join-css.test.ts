import { expect, test } from 'vitest'

import { joinCss } from './join-css'

test('joins truthy class names with a space', () => {
  expect(joinCss('a', 'b', 'c')).toBe('a b c')
})

test('drops false and undefined values', () => {
  expect(joinCss('a', false, undefined, 'b')).toBe('a b')
})

test('returns an empty string when nothing is truthy', () => {
  expect(joinCss(false, undefined)).toBe('')
})

test('returns an empty string with no arguments', () => {
  expect(joinCss()).toBe('')
})
