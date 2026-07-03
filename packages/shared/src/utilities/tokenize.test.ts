import { expect, test } from 'vitest'

import { searchTerms, tokenize } from './tokenize'

test('tokenize lowercases each word', () => {
  expect(tokenize('Лифт')).toEqual(['лифт'])
})

test('tokenize splits on whitespace and punctuation', () => {
  expect(tokenize('Замена тросов, лифта!')).toEqual([
    'замена',
    'тросов',
    'лифта',
  ])
})

test('tokenize keeps digits as their own tokens', () => {
  expect(tokenize('блок 1')).toEqual(['блок', '1'])
})

test('tokenize drops the empty tokens left by leading and trailing separators', () => {
  expect(tokenize('  лифт,  ')).toEqual(['лифт'])
})

test('tokenize removes duplicate words', () => {
  expect(tokenize('лифт лифт')).toEqual(['лифт'])
})

test('tokenize normalizes composed and decomposed spellings to the same token', () => {
  const composed = String.fromCodePoint(0x0439)
  const decomposed = String.fromCodePoint(0x0438, 0x0306)

  expect(tokenize(decomposed)).toEqual(tokenize(composed))
  expect(tokenize(decomposed)).toEqual([composed])
})

test('searchTerms keeps a term of exactly three characters', () => {
  expect(searchTerms('лиф')).toEqual(['лиф'])
})

test('searchTerms drops a term of two characters', () => {
  expect(searchTerms('ли')).toEqual([])
})

test('searchTerms drops short words but keeps the long ones in a multi-word query', () => {
  expect(searchTerms('в лифте')).toEqual(['лифте'])
})

test('searchTerms treats an issue number as a term', () => {
  expect(searchTerms('115')).toEqual(['115'])
})

test('searchTerms returns nothing for a whitespace-only query', () => {
  expect(searchTerms('   ')).toEqual([])
})
