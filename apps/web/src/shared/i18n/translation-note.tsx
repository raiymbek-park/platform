import { useLingui } from '@lingui/react/macro'
import { LinkButton } from '@raiymbek-park/ui'

export type TranslationNoteProps = {
  isShowingOriginal: boolean
  onToggle: () => void
}

export const TranslationNote = ({
  isShowingOriginal,
  onToggle,
}: TranslationNoteProps) => {
  const { t } = useLingui()

  return (
    <LinkButton
      glyph='languages'
      label={
        isShowingOriginal ? t`Показать перевод` : t`Показать оригинальный текст`
      }
      onClick={onToggle}
    />
  )
}
