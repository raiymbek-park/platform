import { joinCss } from '@raiymbek-park/shared'
import { FilterTab } from '@raiymbek-park/ui'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import { useIntersectionObserver } from '@/shared/lib'

import { tabOrder, usePostBadges } from '../model/use-post-badges'
import css from './post-filter-tabs.module.scss'

const route = getRouteApi('/posts/')

export const PostFilterTabs = () => {
  const { tab } = route.useSearch()
  const navigate = route.useNavigate()
  const { tabName } = usePostBadges()
  const [isStuck, setStuck] = useState(false)
  const tabsRef = useIntersectionObserver<HTMLFieldSetElement>({
    rootMargin: '-1px 0px 0px 0px',
    threshold: 1,
    onChange: isVisible => setStuck(!isVisible),
  })

  return (
    <fieldset ref={tabsRef} className={joinCss(css.tabs, isStuck && css.stuck)}>
      <legend className='sr-only'>Фильтр объявлений</legend>
      {tabOrder.map(value => (
        <FilterTab
          key={value}
          isActive={value === tab}
          label={tabName(value)}
          onClick={() => navigate({ search: { tab: value } })}
        />
      ))}
    </fieldset>
  )
}
