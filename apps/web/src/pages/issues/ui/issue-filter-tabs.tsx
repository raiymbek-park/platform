import { joinCss } from '@raiymbek-park/shared'
import { FilterTab } from '@raiymbek-park/ui'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import { useIntersectionObserver } from '../model/use-intersection-observer'
import { filterOrder, useIssueBadges } from '../model/use-issue-badges'
import css from './issue-filter-tabs.module.scss'

const route = getRouteApi('/issues/')

export const IssueFilterTabs = () => {
  const { status } = route.useSearch()
  const navigate = route.useNavigate()
  const { filterName } = useIssueBadges()
  const [isStuck, setStuck] = useState(false)
  const tabsRef = useIntersectionObserver<HTMLFieldSetElement>({
    rootMargin: '-1px 0px 0px 0px',
    threshold: 1,
    onChange: isVisible => setStuck(!isVisible),
  })

  return (
    <fieldset ref={tabsRef} className={joinCss(css.tabs, isStuck && css.stuck)}>
      <legend className='sr-only'>Фильтр по статусу</legend>
      {filterOrder.map(value => (
        <FilterTab
          key={value}
          isActive={value === status}
          label={filterName(value)}
          onClick={() => navigate({ search: { status: value } })}
        />
      ))}
    </fieldset>
  )
}
