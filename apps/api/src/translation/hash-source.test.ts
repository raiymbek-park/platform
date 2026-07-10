import { expect, test } from 'vitest'

import { hashSource } from './hash-source'

test('produces the same hash for the same source parts', () => {
  expect(hashSource('Отключение воды', 'Плановое отключение с 10:00')).toBe(
    hashSource('Отключение воды', 'Плановое отключение с 10:00'),
  )
})

test('produces a different hash when the source text changes (edge-cases 1)', () => {
  const before = hashSource('Отключение воды', 'Плановое отключение с 10:00')
  const after = hashSource('Отключение воды', 'Плановое отключение с 11:00')

  expect(after).not.toBe(before)
})

test('is sensitive to which part changed, not just the concatenated length', () => {
  const titleChanged = hashSource('Отключение света', 'Описание')
  const descriptionChanged = hashSource('Отключение воды', 'Описание изменено')

  expect(titleChanged).not.toBe(descriptionChanged)
})
