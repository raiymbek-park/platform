import type {
  PostCategory,
  PostKind,
} from '@raiymbek-park/shared/validation-schemas'
import type { IconChipTone, IconGlyph } from '@raiymbek-park/ui'

import { useLingui } from '@lingui/react/macro'

import { categoriesOf } from '../lib/validators'

export type CategoryOption = {
  icon: IconGlyph
  label: string
  subtitle: string
  tone: IconChipTone
  value: PostCategory
}

export type CategoryTheme = {
  glyph: IconGlyph
  tone: IconChipTone
}

const announcementStyles: Partial<Record<PostCategory, CategoryTheme>> = {
  city: { glyph: 'landmark', tone: 'accent' },
  complex: { glyph: 'building-2', tone: 'brand' },
  management: { glyph: 'briefcase', tone: 'info' },
  other: { glyph: 'megaphone', tone: 'warning' },
}

const offerStyles: Partial<Record<PostCategory, CategoryTheme>> = {
  free: { glyph: 'gift', tone: 'warning' },
  other: { glyph: 'coffee', tone: 'warning' },
  rent: { glyph: 'key-round', tone: 'accent' },
  sell: { glyph: 'banknote', tone: 'info' },
  services: { glyph: 'handshake', tone: 'brand' },
  wanted: { glyph: 'search', tone: 'accent' },
}

const fallbackTheme: CategoryTheme = { glyph: 'megaphone', tone: 'brand' }

const stylesOf = (kind: PostKind) =>
  kind === 'offer' ? offerStyles : announcementStyles

export const categoryTheme = (
  kind: PostKind,
  category: PostCategory | null,
): CategoryTheme =>
  (category ? stylesOf(kind)[category] : undefined) ?? fallbackTheme

export const usePostCategories = (kind: PostKind): CategoryOption[] => {
  const { t } = useLingui()

  const copy: Partial<
    Record<PostCategory, { label: string; subtitle: string }>
  > =
    kind === 'offer'
      ? {
          free: { label: t`Даром`, subtitle: t`Отдам бесплатно` },
          other: { label: t`Прочее`, subtitle: t`Другая категория` },
          rent: { label: t`Сдам`, subtitle: t`Сдам в аренду` },
          sell: { label: t`Продам`, subtitle: t`Продажа вещей` },
          services: { label: t`Услуги`, subtitle: t`Предлагаю услуги` },
          wanted: { label: t`Требуется`, subtitle: t`Ищу или куплю` },
        }
      : {
          city: {
            label: t`Городское управление`,
            subtitle: t`Городские службы`,
          },
          complex: {
            label: t`ЖК Raiymbek Park`,
            subtitle: t`Вопросы по комплексу`,
          },
          management: {
            label: t`Управляющая компания`,
            subtitle: t`Сервис и эксплуатация`,
          },
          other: { label: t`Прочее`, subtitle: t`Другая категория` },
        }

  return categoriesOf(kind).flatMap(value => {
    const text = copy[value]
    const theme = stylesOf(kind)[value]
    if (!text || !theme) return []
    return [
      {
        icon: theme.glyph,
        label: text.label,
        subtitle: text.subtitle,
        tone: theme.tone,
        value,
      },
    ]
  })
}
