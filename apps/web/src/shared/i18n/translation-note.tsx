import type { Locale } from './config'

import { useLingui } from '@lingui/react/macro'
import { CardTranslation } from '@raiymbek-park/ui'

export type TranslationNoteProps = {
  isShowingOriginal: boolean
  lang: Locale
  onToggle: () => void
}

export const TranslationNote = ({
  isShowingOriginal,
  lang,
  onToggle,
}: TranslationNoteProps) => {
  const { t } = useLingui()

  const sourceName: Record<Locale, string> = {
    en: t`Переведено с английского`,
    kk: t`Переведено с казахского`,
    ru: t`Переведено с русского`,
  }

  return (
    <CardTranslation
      label={sourceName[lang]}
      toggleLabel={
        isShowingOriginal ? t`Показать перевод` : t`Показать оригинал`
      }
      onToggle={onToggle}
    />
  )
}
