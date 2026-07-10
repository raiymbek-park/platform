import type { Locale } from './config'

import { useLingui } from '@lingui/react/macro'

export const useTranslationLabels = () => {
  const { t } = useLingui()

  const sourceName: Record<Locale, string> = {
    en: t`Переведено с английского`,
    kk: t`Переведено с казахского`,
    ru: t`Переведено с русского`,
  }

  return {
    showOriginalLabel: t`Показать оригинал`,
    showTranslationLabel: t`Показать перевод`,
    translatedFrom: (lang: Locale) => sourceName[lang],
  }
}
