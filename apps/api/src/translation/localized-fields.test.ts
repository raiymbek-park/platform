import { expect, test } from 'vitest'

import { hashSource } from './hash-source'
import { localizedFields } from './localized-fields'

const title = 'Отключение воды'
const description = 'Плановое отключение с 10:00'
const translatedRev = hashSource(title, description)

const translatedDoc = {
  description,
  lang: 'ru',
  title,
  translatedRev,
  translations: {
    en: {
      description: 'Scheduled water shutoff from 10:00',
      title: 'Water shutoff',
    },
    kk: { description: 'Жоспарлы сумен өшіру 10:00-ден', title: 'Суды өшіру' },
  },
}

test('happy-path 3: a same-locale viewer sees the original with no translation indicator', () => {
  const result = localizedFields(translatedDoc, 'ru')

  expect(result).toEqual({
    description,
    isTranslated: false,
    original: null,
    originalLang: 'ru',
    title,
  })
})

test('happy-path 2: a fresh translation is substituted and the exact original is carried for the show-original toggle', () => {
  const result = localizedFields(translatedDoc, 'kk')

  expect(result).toEqual({
    description: 'Жоспарлы сумен өшіру 10:00-ден',
    isTranslated: true,
    original: { description, title },
    originalLang: 'ru',
    title: 'Суды өшіру',
  })
})

test('edge-cases 1 / edge-cases 8: a translation stale against the current source text falls back to the original', () => {
  const staleDoc = {
    ...translatedDoc,
    translatedRev: hashSource('a superseded edit', 'from before this one'),
  }

  const result = localizedFields(staleDoc, 'kk')

  expect(result).toEqual({
    description,
    isTranslated: false,
    original: null,
    originalLang: 'ru',
    title,
  })
})

test('error-states 3: a document with no cached translation for the viewer’s locale renders the original normally', () => {
  const result = localizedFields(
    { description, lang: 'ru', title, translatedRev },
    'kk',
  )

  expect(result).toEqual({
    description,
    isTranslated: false,
    original: null,
    originalLang: 'ru',
    title,
  })
})

test('edge-cases 6: a legacy document with no recorded source language defaults it to ru', () => {
  const result = localizedFields({ description, title }, 'ru')

  expect(result.originalLang).toBe('ru')
  expect(result.isTranslated).toBe(false)
})

test('edge-cases 3: the source language reflects the detected text, not the author’s active locale — a same-language viewer sees the original and another sees the translation', () => {
  const kazakhSourceTitle = 'Жарамды тұрғын үй'
  const kazakhSourceDescription = 'Ертең жиналыс өтеді'
  const kazakhRev = hashSource(kazakhSourceTitle, kazakhSourceDescription)
  const doc = {
    description: kazakhSourceDescription,
    lang: 'kk',
    title: kazakhSourceTitle,
    translatedRev: kazakhRev,
    translations: {
      en: { description: 'A meeting is tomorrow', title: 'Valid housing' },
      ru: {
        description: 'Завтра состоится собрание',
        title: 'Действующее жильё',
      },
    },
  }

  const kazakhViewer = localizedFields(doc, 'kk')
  expect(kazakhViewer.isTranslated).toBe(false)
  expect(kazakhViewer.originalLang).toBe('kk')

  const russianViewer = localizedFields(doc, 'ru')
  expect(russianViewer.isTranslated).toBe(true)
  expect(russianViewer.originalLang).toBe('kk')
  expect(russianViewer.title).toBe('Действующее жильё')
})
