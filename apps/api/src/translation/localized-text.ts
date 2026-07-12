import type { DocumentData } from 'firebase-admin/firestore'
import type { Locale } from '../i18n'

import { resolveLocale } from '../i18n'
import { toText } from '../store-helpers'
import { hashSource } from './hash-source'

export type LocalizedText = {
  isTranslated: boolean
  original: string | null
  originalLang: Locale
  text: string
}

export const localizedText = (
  data: DocumentData,
  locale: Locale,
): LocalizedText => {
  const text = toText(data.text)
  const originalLang = resolveLocale(toText(data.lang))
  const untranslated = {
    isTranslated: false,
    original: null,
    originalLang,
    text,
  }
  if (locale === originalLang) return untranslated
  const translation = toText(data.translations?.[locale]?.text)
  if (!translation) return untranslated
  const isFresh = toText(data.translatedRev) === hashSource(text)
  if (!isFresh) return untranslated
  return {
    isTranslated: true,
    original: text,
    originalLang,
    text: translation,
  }
}
