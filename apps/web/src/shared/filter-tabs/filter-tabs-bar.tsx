import { joinCss } from '@raiymbek-park/shared'
import { FilterTab } from '@raiymbek-park/ui'
import { useState } from 'react'

import { useIntersectionObserver } from '@/shared/lib'

import css from './filter-tabs-bar.module.scss'

type FilterTabsBarProps<T extends string> = {
  activeValue: T
  legend: string
  options: readonly T[]
  labelOf: (value: T) => string
  onSelect: (value: T) => void
}

export const FilterTabsBar = <T extends string>({
  activeValue,
  legend,
  options,
  labelOf,
  onSelect,
}: FilterTabsBarProps<T>) => {
  const [isStuck, setStuck] = useState(false)
  const tabsRef = useIntersectionObserver<HTMLFieldSetElement>({
    rootMargin: '-1px 0px 0px 0px',
    threshold: 1,
    onChange: isVisible => setStuck(!isVisible),
  })

  return (
    <fieldset ref={tabsRef} className={joinCss(css.tabs, isStuck && css.stuck)}>
      <legend className='sr-only'>{legend}</legend>
      {options.map(value => (
        <FilterTab
          key={value}
          isActive={value === activeValue}
          label={labelOf(value)}
          onClick={() => onSelect(value)}
        />
      ))}
    </fieldset>
  )
}
