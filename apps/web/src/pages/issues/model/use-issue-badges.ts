import type {
  ClassificationTag,
  IssueCategory,
  IssueStatus,
} from '@raiymbek-park/shared/validation-schemas'
import type { IssueCardBadge, StatusTagTone } from '@raiymbek-park/ui'
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

const categoryTone: Record<IssueCategory, StatusTagTone> = {
  repair: 'info',
  replacement: 'accent',
  complaint: 'warning',
  violation: 'danger',
  other: 'neutral',
}

const statusTone: Record<IssueStatus, StatusTagTone> = {
  incoming: 'info',
  'in-progress': 'accent',
  planned: 'info',
  blocked: 'danger',
  'resident-review': 'warning',
  done: 'brand',
  rejected: 'neutral',
}

const tagTone: Record<ClassificationTag, StatusTagTone> = {
  warranty: 'brand',
  'needs-clarification': 'neutral',
  duplicate: 'neutral',
}

export const useIssueBadges = () => {
  const { t } = useLingui()

  const categoryLabel: Record<IssueCategory, string> = {
    repair: t`Ремонт`,
    replacement: t`Замена`,
    complaint: t`Жалоба`,
    violation: t`Нарушение`,
    other: t`Другое`,
  }

  const statusLabel: Record<IssueStatus, string> = {
    incoming: t`Входящие`,
    'in-progress': t`В работе`,
    planned: t`Запланировано`,
    blocked: t`Заблокировано`,
    'resident-review': t`На рассмотрение жильцам`,
    done: t`Выполнено`,
    rejected: t`Отклонено`,
  }

  const tagLabel: Record<ClassificationTag, string> = {
    warranty: t`По гарантии`,
    'needs-clarification': t`Требуется уточнение`,
    duplicate: t`Дубликат`,
  }

  const statusName = (status: IssueStatus) => statusLabel[status]

  const cardBadges = (issue: IssueView): IssueCardBadge[] => {
    const badges: IssueCardBadge[] = [
      {
        id: 'category',
        label: categoryLabel[issue.category],
        tone: categoryTone[issue.category],
      },
      {
        id: 'status',
        label: statusLabel[issue.status],
        tone: statusTone[issue.status],
      },
    ]
    if (!issue.urgent) return badges
    return [...badges, { id: 'urgent', label: t`Срочно`, tone: 'danger' }]
  }

  const cardTags = (issue: IssueView): IssueCardBadge[] =>
    issue.tags.map(tag => ({
      id: tag,
      label: tagLabel[tag],
      tone: tagTone[tag],
    }))

  return { cardBadges, cardTags, statusName }
}
