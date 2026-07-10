import { expect, test } from 'vitest'

import { buildKeywords } from './keywords'

test('expands a word into prefixes from two characters up to the whole word', () => {
  expect(buildKeywords({ number: 1, titles: ['лифта'] })).toEqual(
    expect.arrayContaining(['ли', 'лиф', 'лифт', 'лифта']),
  )
})

test('never emits a prefix shorter than two characters', () => {
  const keywords = buildKeywords({ number: 1, titles: ['лифта'] })

  expect(keywords).not.toContain('л')
})

test('keeps a word of two characters or fewer whole', () => {
  expect(buildKeywords({ number: 1, titles: ['юг'] })).toContain('юг')
})

test('expands every word of a multi-word title', () => {
  expect(buildKeywords({ number: 1, titles: ['Замена тросов'] })).toEqual(
    expect.arrayContaining(['за', 'замена', 'тр', 'тросов']),
  )
})

test('includes the issue number as a searchable term', () => {
  expect(buildKeywords({ number: 118, titles: ['дом'] })).toContain('118')
})

test('deduplicates prefixes shared across titles that differ only by case', () => {
  const keywords = buildKeywords({ number: 1, titles: ['Лифт', 'лифт'] })

  expect(keywords.length).toBe(new Set(keywords).size)
  expect(keywords).toEqual(expect.arrayContaining(['лиф', 'лифт']))
})

test('edge-cases 9: the issue number stays searchable once cross-language titles are added to the same keyword set', () => {
  const keywords = buildKeywords({
    number: 118,
    titles: [
      'Не работает домофон',
      'Домофон жұмыс істемейді',
      'Intercom broken',
    ],
  })

  expect(keywords).toContain('118')
})
