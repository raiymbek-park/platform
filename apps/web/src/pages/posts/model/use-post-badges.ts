import type {
  PostCategory,
  PostTab,
} from '@raiymbek-park/shared/validation-schemas'
import type { ContentCardBadge, StatusTagTone } from '@raiymbek-park/ui'
import type { CategoryVisual } from '@/shared/post'
import type { PostView } from './use-posts-data'

import { useLingui } from '@lingui/react/macro'

import {
  announcementVisuals,
  fallbackVisual,
  offerVisuals,
} from '@/shared/post'

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

  const categoryVisual = (post: PostView): CategoryVisual =>
    (post.kind === 'announcement' ? announcementVisuals : offerVisuals)[
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
