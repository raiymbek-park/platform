import type { DocumentData } from 'firebase-admin/firestore'
import type { Locale } from '../i18n'
import type {
  DocumentTranslation,
  TranslatableFields,
} from './translation-client'

import { resolveLocale } from '../i18n'
import { toText } from '../store-helpers'
import { hashSource } from './hash-source'

type TranslateDocument = (input: {
  sourceLocaleHint: Locale
  texts: TranslatableFields
}) => Promise<DocumentTranslation | null>

export type TranslationWrite = DocumentTranslation & {
  keywords: string[]
  translatedRev: string
}

type TranslateDocumentFieldsInput = {
  buildKeywords: (titles: string[]) => string[]
  data: DocumentData
  translate: TranslateDocument
}

export const translateDocumentFields = async ({
  buildKeywords,
  data,
  translate,
}: TranslateDocumentFieldsInput): Promise<TranslationWrite | null> => {
  const texts = {
    description: toText(data.description),
    title: toText(data.title),
  }
  if (!texts.title && !texts.description) return null
  const translatedRev = hashSource(texts.title, texts.description)
  if (toText(data.translatedRev) === translatedRev) return null
  const result = await translate({
    sourceLocaleHint: resolveLocale(toText(data.lang)),
    texts,
  })
  if (!result) return null
  const translatedTitles = Object.values(result.translations).flatMap(fields =>
    fields ? [fields.title] : [],
  )
  return {
    ...result,
    keywords: buildKeywords([texts.title, ...translatedTitles]),
    translatedRev,
  }
}
