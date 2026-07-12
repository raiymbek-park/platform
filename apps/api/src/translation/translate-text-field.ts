import type { DocumentData } from 'firebase-admin/firestore'
import type { Locale } from '../i18n'
import type { TextTranslation } from './translation-client'

import { resolveLocale } from '../i18n'
import { toText } from '../store-helpers'
import { hashSource } from './hash-source'

type TranslateTextField = (input: {
  sourceLocaleHint: Locale
  text: string
}) => Promise<TextTranslation | null>

export type TextTranslationWrite = TextTranslation & {
  translatedRev: string
}

type TranslateTextFieldInput = {
  data: DocumentData
  translate: TranslateTextField
}

export const translateTextField = async ({
  data,
  translate,
}: TranslateTextFieldInput): Promise<TextTranslationWrite | null> => {
  const text = toText(data.text)
  if (!text) return null
  const translatedRev = hashSource(text)
  if (toText(data.translatedRev) === translatedRev) return null
  const result = await translate({
    sourceLocaleHint: resolveLocale(toText(data.lang)),
    text,
  })
  if (!result) return null
  return { ...result, translatedRev }
}
