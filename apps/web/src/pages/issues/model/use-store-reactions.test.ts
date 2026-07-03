import { expect, test } from 'vitest'

import { useStoreReactions } from './use-store-reactions'

const store = () => useStoreReactions.getState()

const reset = () => useStoreReactions.setState({ reactions: {} })

test('apply stores the resolved reaction for an issue', () => {
  reset()
  store().apply('a', 'like')

  expect(store().reactions).toEqual({ a: 'like' })
})

test('a later apply overwrites the earlier overlay', () => {
  reset()
  store().apply('a', 'like')
  store().apply('a', null)

  expect(store().reactions).toEqual({ a: null })
})

test('clear removes the overlay when it still equals the resolved value', () => {
  reset()
  store().apply('a', 'like')
  store().clear('a', 'like')

  expect(store().reactions).toEqual({})
})

test('a stale clear does not clobber a newer overlay (rapid double-tap)', () => {
  reset()
  store().apply('a', 'like')
  store().apply('a', null)
  store().clear('a', 'like')

  expect(store().reactions).toEqual({ a: null })
})

test('clear leaves other issues untouched', () => {
  reset()
  store().apply('a', 'like')
  store().apply('b', 'dislike')
  store().clear('a', 'like')

  expect(store().reactions).toEqual({ b: 'dislike' })
})
