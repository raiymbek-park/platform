import { expect, test } from 'vitest'

import { buildPostKeywords } from './keywords'

test('expands a word into prefixes from two characters up to the whole word', () => {
  expect(buildPostKeywords(['велосипед'])).toEqual(
    expect.arrayContaining(['ве', 'вел', 'велосипед']),
  )
})

test('never emits a prefix shorter than two characters', () => {
  expect(buildPostKeywords(['велосипед'])).not.toContain('в')
})

test('keeps a word of two characters or fewer whole', () => {
  expect(buildPostKeywords(['юг'])).toContain('юг')
})

test('expands every word of a multi-word title', () => {
  expect(buildPostKeywords(['Продам велосипед'])).toEqual(
    expect.arrayContaining(['пр', 'продам', 'ве', 'велосипед']),
  )
})

test('deduplicates prefixes shared across words that differ only by case', () => {
  const keywords = buildPostKeywords(['Велосипед велосипед'])

  expect(keywords.length).toBe(new Set(keywords).size)
})
