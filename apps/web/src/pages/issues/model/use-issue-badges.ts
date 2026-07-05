import type {
  ClassificationTag,
  IssueCategory,
  IssueFilter,
  IssueStatus,
} from '@raiymbek-park/shared/validation-schemas'
import type { IssueCardBadge, StatusTagTone } from '@raiymbek-park/ui'
import type { IssueView } from './use-issues-data'

import { useLingui } from '@lingui/react/macro'

import { statusGlyphs, statusTones } from '@/shared/issue'

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

const tagTone: Record<ClassificationTag, StatusTagTone> = {
  warranty: 'brand',
  'needs-clarification': 'neutral',
  duplicate: 'neutral',
}

const categoryTone: Record<IssueCategory, StatusTagTone> = {
  repair: 'info',
  replacement: 'accent',
  complaint: 'warning',
  violation: 'danger',
  other: 'neutral',
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

  const categoryLabel: Record<IssueCategory, string> = {
    repair: t`Ремонт`,
    replacement: t`Замена`,
    complaint: t`Жалоба`,
    violation: t`Нарушение`,
    other: t`Прочее`,
  }

  const filterName = (filter: IssueFilter) => filterLabel[filter]

  const cardTags = (issue: IssueView): IssueCardBadge[] => {
    const urgent: IssueCardBadge[] = issue.urgent
      ? [{ id: 'urgent', label: t`Срочно`, tone: 'danger' }]
      : []
    const category: IssueCardBadge = {
      id: 'category',
      label: categoryLabel[issue.category],
      tone: categoryTone[issue.category],
    }
    const tags: IssueCardBadge[] = issue.tags.map(tag => ({
      id: tag,
      label: tagLabel[tag],
      tone: tagTone[tag],
    }))
    return [...urgent, category, ...tags]
  }

  return {
    cardStatusLabel: (status: IssueStatus) => cardStatusLabel[status],
    cardTags,
    filterName,
    statusGlyph: (status: IssueStatus) => statusGlyphs[status],
    statusTone: (status: IssueStatus) => statusTones[status],
  }
}
