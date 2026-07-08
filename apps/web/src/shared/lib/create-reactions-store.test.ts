import { expect, test } from 'vitest'

import { createReactionsStore } from './create-reactions-store'

test('apply stores the optimistic reaction for an id', () => {
  const store = createReactionsStore()
  store.getState().apply('id-1', 'like')

  expect(store.getState().reactions['id-1']).toBe('like')
})

test('apply overwrites a previous reaction with the newer one', () => {
  const store = createReactionsStore()
  store.getState().apply('id-1', 'like')
  store.getState().apply('id-1', 'dislike')

  expect(store.getState().reactions['id-1']).toBe('dislike')
})

test('clear removes the overlay when it still holds the same reaction', () => {
  const store = createReactionsStore()
  store.getState().apply('id-1', 'like')
  store.getState().clear('id-1', 'like')

  expect(store.getState().reactions).toEqual({})
})

test('clear keeps a newer reaction applied after the stale one settles', () => {
  const store = createReactionsStore()
  store.getState().apply('id-1', 'like')
  store.getState().apply('id-1', 'dislike')
  store.getState().clear('id-1', 'like')

  expect(store.getState().reactions['id-1']).toBe('dislike')
})

test('separate instances hold independent state', () => {
  const issues = createReactionsStore()
  const posts = createReactionsStore()
  issues.getState().apply('id-1', 'like')

  expect(posts.getState().reactions).toEqual({})
})
