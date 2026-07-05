import type {
  ClassificationTag,
  IssueFilter,
  IssueStatus,
} from '@raiymbek-park/shared/validation-schemas'
import type {
  IconChipTone,
  IconGlyph,
  IssueCardBadge,
  StatusTagTone,
} from '@raiymbek-park/ui'
import type { IssueView } from './use-issues-data'

import { useLingui } from '@lingui/react/macro'

const statusOrder: IssueStatus[] = [
  'new',
  'in-progress',
  'blocked',
  'done',
  'rejected',
  'resident-review',
  'planned',
]

export const filterOrder: IssueFilter[] = ['all', ...statusOrder]

const statusGlyph: Record<IssueStatus, IconGlyph> = {
  new: 'inbox',
  'in-progress': 'wrench',
  planned: 'calendar-clock',
  blocked: 'ban',
  'resident-review': 'users-round',
  done: 'circle-check-big',
  rejected: 'circle-x',
}

const statusTone: Record<IssueStatus, IconChipTone> = {
  new: 'warning',
  'in-progress': 'action',
  planned: 'action',
  blocked: 'danger',
  'resident-review': 'accent',
  done: 'brand',
  rejected: 'danger',
}

const tagTone: Record<ClassificationTag, StatusTagTone> = {
  warranty: 'brand',
  'needs-clarification': 'neutral',
  duplicate: 'neutral',
}

export const useIssueBadges = () => {
  const { t } = useLingui()

  const filterLabel: Record<IssueFilter, string> = {
    all: t`Все`,
    new: t`Новые`,
    'in-progress': t`В работе`,
    planned: t`Запланировано`,
    blocked: t`Заблокировано`,
    'resident-review': t`На рассмотрение жильцам`,
    done: t`Выполнено`,
    rejected: t`Отклонено`,
  }

  const cardStatusLabel: Record<IssueStatus, string> = {
    new: t`Новая заявка`,
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

  const filterName = (filter: IssueFilter) => filterLabel[filter]

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
    filterName,
    statusGlyph: (status: IssueStatus) => statusGlyph[status],
    statusTone: (status: IssueStatus) => statusTone[status],
  }
}
