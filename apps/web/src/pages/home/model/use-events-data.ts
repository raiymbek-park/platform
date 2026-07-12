import type { Event } from '@raiymbek-park/api'
import type { IssueStatus } from '@raiymbek-park/shared/validation-schemas'
import type { IconChipTone, IconGlyph } from '@raiymbek-park/ui'

import { useLingui } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'
import { statusGlyphs, statusTones } from '@/shared/issue'
import {
  announcementVisuals,
  fallbackVisual,
  offerVisuals,
} from '@/shared/post'

type ChangeView = {
  glyph: IconGlyph
  id: string
  text: string
  tone: IconChipTone
}

export const useEventsData = () => {
  const { t } = useLingui()
  const trpc = useTRPC()

  const statusLabel: Record<IssueStatus, string> = {
    new: t`Новая`,
    'in-progress': t`В работе`,
    planned: t`Запланировано`,
    blocked: t`Заблокировано`,
    'resident-review': t`На рассмотрении жильцов`,
    done: t`Выполнено`,
    rejected: t`Отклонено`,
  }

  const toChangeView = (event: Event): ChangeView => {
    if (event.type === 'announcement') {
      const visual = announcementVisuals[event.category] ?? fallbackVisual
      return { ...visual, id: event.id, text: event.title }
    }
    if (event.type === 'offer') {
      const visual = offerVisuals[event.category] ?? fallbackVisual
      return { ...visual, id: event.id, text: event.title }
    }
    if (event.type === 'issue-status') {
      return {
        glyph: statusGlyphs[event.status],
        id: `status-${event.issueId}`,
        text: t`Заявка №${event.number}: ${statusLabel[event.status]}`,
        tone: statusTones[event.status],
      }
    }
    return {
      glyph: 'message-circle',
      id: `comment-${event.issueId}`,
      text: t`Новые сообщения по заявке №${event.number}`,
      tone: 'info',
    }
  }

  return useQuery({
    ...trpc.events.list.queryOptions(),
    select: events => events.map(toChangeView),
    staleTime: Number.POSITIVE_INFINITY,
  })
}
