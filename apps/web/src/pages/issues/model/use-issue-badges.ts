import type {
  ClassificationTag,
  IssueStatus,
} from '@raiymbek-park/shared/validation-schemas'
import type {
  IconGlyph,
  IssueCardBadge,
  StatusTagTone,
} from '@raiymbek-park/ui'
import type { IssueView } from './use-issues-data'

import { useLingui } from '@lingui/react/macro'

export const statusOrder: IssueStatus[] = [
  'incoming',
  'in-progress',
  'blocked',
  'done',
  'rejected',
  'resident-review',
  'planned',
]

const statusGlyph: Record<IssueStatus, IconGlyph> = {
  incoming: 'inbox',
  'in-progress': 'wrench',
  planned: 'calendar-clock',
  blocked: 'ban',
  'resident-review': 'users-round',
  done: 'circle-check-big',
  rejected: 'circle-x',
}

const tagTone: Record<ClassificationTag, StatusTagTone> = {
  warranty: 'brand',
  'needs-clarification': 'neutral',
  duplicate: 'neutral',
}

export const useIssueBadges = () => {
  const { t } = useLingui()

  const filterLabel: Record<IssueStatus, string> = {
    incoming: t`Входящие`,
    'in-progress': t`В работе`,
    planned: t`Запланировано`,
    blocked: t`Заблокировано`,
    'resident-review': t`На рассмотрение жильцам`,
    done: t`Выполнено`,
    rejected: t`Отклонено`,
  }

  const cardStatusLabel: Record<IssueStatus, string> = {
    incoming: t`Новая заявка`,
    'in-progress': t`В работе`,
    planned: t`Запланировано`,
    blocked: t`Заблокировано`,
    'resident-review': t`На рассмотрении жильцов`,
    done: t`Выполнено`,
    rejected: t`Отклонено`,
  }

  const tagLabel: Record<ClassificationTag, string> = {
    warranty: t`По гарантии`,
    'needs-clarification': t`Требуется уточнение`,
    duplicate: t`Дубликат`,
  }

  const statusName = (status: IssueStatus) => filterLabel[status]

  const cardTags = (issue: IssueView): IssueCardBadge[] => {
    const tags: IssueCardBadge[] = issue.tags.map(tag => ({
      id: tag,
      label: tagLabel[tag],
      tone: tagTone[tag],
    }))
    if (!issue.urgent) return tags
    return [{ id: 'urgent', label: t`Срочно`, tone: 'danger' }, ...tags]
  }

  return {
    cardStatusLabel: (status: IssueStatus) => cardStatusLabel[status],
    cardTags,
    statusGlyph: (status: IssueStatus) => statusGlyph[status],
    statusName,
  }
}
