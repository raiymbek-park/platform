import { getRouteApi } from '@tanstack/react-router'

import { FilterTabsBar } from '@/shared/filter-tabs'

import { tabOrder, usePostBadges } from '../model/use-post-badges'

const route = getRouteApi('/posts/')

export const PostFilterTabs = () => {
  const { tab } = route.useSearch()
  const navigate = route.useNavigate()
  const { tabName } = usePostBadges()

  return (
    <FilterTabsBar
      activeValue={tab}
      legend='Фильтр объявлений'
      options={tabOrder}
      labelOf={tabName}
      onSelect={value => navigate({ search: { tab: value } })}
    />
  )
}
