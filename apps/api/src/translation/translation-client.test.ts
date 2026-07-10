import { expect, test, vi } from 'vitest'

const parseMock = vi.hoisted(() => vi.fn())

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { parse: parseMock }
  },
}))

const { parseDocumentTranslation, translateDocument, translateText } =
  await import('./translation-client')

const documentTranslation = {
  detectedLang: 'ru' as const,
  translations: {
    en: { description: 'Water shutoff notice', title: 'Water shutoff' },
    kk: { description: 'Суды өшіру туралы хабарлама', title: 'Суды өшіру' },
  },
}

test('happy-path 1: returns the detected source language and both target-locale translations', async () => {
  parseMock.mockResolvedValueOnce({ parsed_output: documentTranslation })

  const result = await translateDocument({
    apiKey: 'test-key',
    sourceLocaleHint: 'ru',
    texts: {
      description: 'Плановое отключение воды',
      title: 'Отключение воды',
    },
  })

  expect(result).toEqual({
    lang: 'ru',
    translations: {
      en: { description: 'Water shutoff notice', title: 'Water shutoff' },
      kk: { description: 'Суды өшіру туралы хабарлама', title: 'Суды өшіру' },
    },
  })
})

test('error-states 1 / error-states 3: a null provider response never produces a partial write', async () => {
  parseMock.mockResolvedValueOnce({ parsed_output: null })

  const result = await translateDocument({
    apiKey: 'test-key',
    sourceLocaleHint: 'ru',
    texts: { description: 'Описание', title: 'Заголовок' },
  })

  expect(result).toBeNull()
})

test('error-states 1 / error-states 3: a response missing one target locale is never returned as a partial translations map', async () => {
  parseMock.mockResolvedValueOnce({
    parsed_output: {
      detectedLang: 'ru',
      translations: { en: documentTranslation.translations.en },
    },
  })

  const result = await translateDocument({
    apiKey: 'test-key',
    sourceLocaleHint: 'ru',
    texts: { description: 'Описание', title: 'Заголовок' },
  })

  expect(result).toBeNull()
})

test('happy-path 5: translateText returns the detected source language and both target-locale text translations', async () => {
  parseMock.mockResolvedValueOnce({
    parsed_output: {
      detectedLang: 'ru',
      translations: {
        en: { text: 'Great offer' },
        kk: { text: 'Тамаша ұсыныс' },
      },
    },
  })

  const result = await translateText({
    apiKey: 'test-key',
    sourceLocaleHint: 'en',
    text: 'Отличное предложение',
  })

  expect(result).toEqual({
    lang: 'ru',
    translations: {
      en: { text: 'Great offer' },
      kk: { text: 'Тамаша ұсыныс' },
    },
  })
})

test('edge-cases 6: parseDocumentTranslation recovers a valid batch result for the backfill script', () => {
  const raw = JSON.stringify(documentTranslation)

  expect(parseDocumentTranslation(raw)).toEqual({
    lang: 'ru',
    translations: {
      en: { description: 'Water shutoff notice', title: 'Water shutoff' },
      kk: { description: 'Суды өшіру туралы хабарлама', title: 'Суды өшіру' },
    },
  })
})

test('error-states 3: parseDocumentTranslation returns null for malformed JSON, never a partial write', () => {
  expect(parseDocumentTranslation('not json')).toBeNull()
})

test('error-states 3: parseDocumentTranslation returns null when the schema does not validate', () => {
  const raw = JSON.stringify({ detectedLang: 'xx', translations: {} })

  expect(parseDocumentTranslation(raw)).toBeNull()
})

test('error-states 3: parseDocumentTranslation returns null when a target locale is missing, never a partial map', () => {
  const raw = JSON.stringify({
    detectedLang: 'ru',
    translations: { en: documentTranslation.translations.en },
  })

  expect(parseDocumentTranslation(raw)).toBeNull()
})
