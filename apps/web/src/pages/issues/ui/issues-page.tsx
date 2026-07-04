import { useLingui } from '@lingui/react/macro'
import { pickCss } from '@raiymbek-park/shared'
import { Content, Icon, ScreenHeader } from '@raiymbek-park/ui'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useState } from 'react'

import { BottomNav } from '@/widgets/bottom-nav'

import { useDebouncedCallback } from '../model/use-debounced-callback'
import { useScrollDirection } from '../model/use-scroll-direction'
import { IssueFilterTabs } from './issue-filter-tabs'
import { IssueList } from './issue-list'
import { IssueSearch } from './issue-search'
import css from './issues-page.module.scss'

const route = getRouteApi('/issues')

const fabCss = pickCss(css, css.fab)

export const IssuesPage = () => {
  const { t } = useLingui()
  const { status } = route.useSearch()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const isScrollingDown = useScrollDirection()
  const debouncedSearch = useDebouncedCallback({
    callback: setSearch,
    delay: 300,
  })

  const handleSearch = (value: string) => {
    setQuery(value)
    debouncedSearch(value)
  }

  return (
    <>
      <ScreenHeader />
      <Content gap={16}>
        <header className={css.intro}>
          <h1 className={css.title}>{t`Заявки`}</h1>
          <p className={css.subtitle}>
            {t`Обращения жильцов в управляющую компанию и их статусы.`}
          </p>
        </header>
        <IssueSearch value={query} onChange={handleSearch} />
        <IssueFilterTabs />
        <IssueList query={query} search={search} status={status} />
      </Content>
      <Link
        aria-label={t`Новая заявка`}
        className={fabCss({ isHidden: isScrollingDown })}
        search={{ status: 'new' }}
        to='/issues/new'
      >
        <Icon glyph='plus' size={26} />
      </Link>
      <BottomNav active='/issues' />
    </>
  )
}
