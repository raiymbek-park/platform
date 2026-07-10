import type { DocumentData } from 'firebase-admin/firestore'
import type { Locale } from '../i18n'

import { resolveLocale } from '../i18n'
import { toText } from '../store-helpers'
import { hashSource } from './hash-source'

export type LocalizedFields = {
  description: string
  isTranslated: boolean
  original: { description: string; title: string } | null
  originalLang: Locale
  title: string
}

export const localizedFields = (
  data: DocumentData,
  locale: Locale,
): LocalizedFields => {
  const description = toText(data.description)
  const title = toText(data.title)
  const originalLang = resolveLocale(toText(data.lang))
  const untranslated = {
    description,
    isTranslated: false,
    original: null,
    originalLang,
    title,
  }
  if (locale === originalLang) return untranslated
  const translation = {
    description: toText(data.translations?.[locale]?.description),
    title: toText(data.translations?.[locale]?.title),
  }
  if (!translation.title || !translation.description) return untranslated
  const isFresh = toText(data.translatedRev) === hashSource(title, description)
  if (!isFresh) return untranslated
  return {
    ...translation,
    isTranslated: true,
    original: { description, title },
    originalLang,
  }
}
