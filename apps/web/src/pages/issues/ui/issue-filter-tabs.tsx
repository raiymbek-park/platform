import { getRouteApi } from '@tanstack/react-router'

import { FilterTabsBar } from '@/shared/filter-tabs'

import { filterOrder, useIssueBadges } from '../model/use-issue-badges'

const route = getRouteApi('/issues/')

export const IssueFilterTabs = () => {
  const { status } = route.useSearch()
  const navigate = route.useNavigate()
  const { filterName } = useIssueBadges()

  return (
    <FilterTabsBar
      activeValue={status}
      legend='Фильтр по статусу'
      options={filterOrder}
      labelOf={filterName}
      onSelect={value => navigate({ search: { status: value } })}
    />
  )
}
