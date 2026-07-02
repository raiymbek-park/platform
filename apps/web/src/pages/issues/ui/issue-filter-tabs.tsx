import { FilterTab } from '@raiymbek-park/ui'
import { getRouteApi } from '@tanstack/react-router'

import { statusOrder, useIssueBadges } from '../model/use-issue-badges'
import css from './issue-filter-tabs.module.scss'

const route = getRouteApi('/issues')

export const IssueFilterTabs = () => {
  const { status } = route.useSearch()
  const navigate = route.useNavigate()
  const { statusName } = useIssueBadges()

  return (
    <fieldset className={css.tabs}>
      <legend className='sr-only'>Фильтр по статусу</legend>
      {statusOrder.map(value => (
        <FilterTab
          key={value}
          isActive={value === status}
          label={statusName(value)}
          onClick={() => navigate({ search: { status: value } })}
        />
      ))}
    </fieldset>
  )
}
