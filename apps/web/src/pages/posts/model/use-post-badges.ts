import type {
  PostCategory,
  PostTab,
} from '@raiymbek-park/shared/validation-schemas'
import type {
  ContentCardBadge,
  IconChipTone,
  IconGlyph,
  StatusTagTone,
} from '@raiymbek-park/ui'
import type { PostView } from './use-posts-data'

import { useLingui } from '@lingui/react/macro'

type Visual = {
  glyph: IconGlyph
  tone: IconChipTone
}

const announcementVisual: Partial<Record<PostCategory, Visual>> = {
  city: { glyph: 'landmark', tone: 'accent' },
  complex: { glyph: 'building-2', tone: 'brand' },
  management: { glyph: 'briefcase', tone: 'info' },
  other: { glyph: 'megaphone', tone: 'warning' },
}

const offerVisual: Partial<Record<PostCategory, Visual>> = {
  free: { glyph: 'gift', tone: 'warning' },
  other: { glyph: 'coffee', tone: 'warning' },
  rent: { glyph: 'key-round', tone: 'accent' },
  sell: { glyph: 'banknote', tone: 'info' },
  services: { glyph: 'handshake', tone: 'brand' },
  wanted: { glyph: 'search', tone: 'accent' },
}

const fallbackVisual: Visual = { glyph: 'megaphone', tone: 'neutral' }

const offerTagTone: Partial<Record<PostCategory, StatusTagTone>> = {
  free: 'warning',
  other: 'warning',
  rent: 'accent',
  sell: 'info',
  services: 'brand',
  wanted: 'accent',
}

export const tabOrder: PostTab[] = ['all', 'announcements', 'offers']

export const usePostBadges = () => {
  const { t } = useLingui()

  const tabLabel: Record<PostTab, string> = {
    all: t`Все`,
    announcements: t`Уведомления`,
    offers: t`Частные объявления`,
  }

  const offerTagLabel: Partial<Record<PostCategory, string>> = {
    free: t`Даром`,
    other: t`Прочее`,
    rent: t`Сдам`,
    sell: t`Продам`,
    services: t`Услуги`,
    wanted: t`Требуется`,
  }

  const announcementSource: Partial<Record<PostCategory, string>> = {
    city: t`Городское управление`,
    complex: t`ЖК Raiymbek Park`,
    management: t`Управляющая компания`,
  }

  const categoryVisual = (post: PostView): Visual =>
    (post.kind === 'announcement' ? announcementVisual : offerVisual)[
      post.category
    ] ?? fallbackVisual

  const authorLabel = (post: PostView): string =>
    post.kind === 'offer'
      ? post.authorName
      : (announcementSource[post.category] ?? post.authorName)

  const cardTags = (post: PostView): ContentCardBadge[] => {
    if (post.kind !== 'offer') return []
    const label = offerTagLabel[post.category]
    const tone = offerTagTone[post.category]
    return label && tone ? [{ id: 'category', label, tone }] : []
  }

  return {
    authorLabel,
    cardTags,
    categoryGlyph: (post: PostView) => categoryVisual(post).glyph,
    categoryTone: (post: PostView) => categoryVisual(post).tone,
    tabName: (tab: PostTab) => tabLabel[tab],
  }
}
