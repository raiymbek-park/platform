import { expect, test, vi } from 'vitest'

import { hashSource } from './hash-source'
import { translateDocumentFields } from './translate-document-fields'

const buildKeywords = (titles: string[]): string[] =>
  titles.flatMap(title => title.toLowerCase().split(' '))

test('edge-cases 2: an edit that does not touch the source text triggers no retranslation', async () => {
  const title = 'Отключение воды'
  const description = 'Плановое отключение с 10:00'
  const translate = vi.fn()

  const write = await translateDocumentFields({
    buildKeywords,
    data: {
      description,
      lang: 'ru',
      title,
      translatedRev: hashSource(title, description),
    },
    translate,
  })

  expect(write).toBeNull()
  expect(translate).not.toHaveBeenCalled()
})

test('edge-cases 1: a changed source text triggers a fresh translation call with the new hash', async () => {
  const title = 'Отключение света'
  const description = 'Плановое отключение с 11:00'
  const translate = vi.fn().mockResolvedValueOnce({
    lang: 'ru',
    translations: {
      en: {
        description: 'Scheduled power outage from 11:00',
        title: 'Power outage',
      },
      kk: { description: 'Жоспарлы өшіру 11:00-ден', title: 'Жарықты өшіру' },
    },
  })

  const write = await translateDocumentFields({
    buildKeywords,
    data: {
      description,
      lang: 'ru',
      title,
      translatedRev: hashSource('a stale hash', 'from a previous edit'),
    },
    translate,
  })

  expect(translate).toHaveBeenCalledWith({
    sourceLocaleHint: 'ru',
    texts: { description, title },
  })
  expect(write?.translatedRev).toBe(hashSource(title, description))
  expect(write?.lang).toBe('ru')
})

test('error-states 1 / error-states 3: a provider failure returns null so no write happens', async () => {
  const translate = vi.fn().mockResolvedValueOnce(null)

  const write = await translateDocumentFields({
    buildKeywords,
    data: {
      description: 'Плановое отключение воды',
      lang: 'ru',
      title: 'Отключение воды',
    },
    translate,
  })

  expect(write).toBeNull()
})

test('happy-path 7 / edge-cases 7: rebuilt keywords include a word only present in the translated title', async () => {
  const translate = vi.fn().mockResolvedValueOnce({
    lang: 'ru',
    translations: {
      en: { description: 'Advertisement', title: 'Advertisement' },
      kk: { description: 'жарнама туралы', title: 'жарнама' },
    },
  })

  const write = await translateDocumentFields({
    buildKeywords,
    data: {
      description: 'Описание объявления',
      lang: 'ru',
      title: 'Объявление',
    },
    translate,
  })

  expect(write?.keywords).toContain('жарнама')
})
