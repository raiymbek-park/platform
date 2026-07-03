import { useLingui } from '@lingui/react/macro'
import { Content, ScreenHeader } from '@raiymbek-park/ui'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import { BottomNav } from '@/widgets/bottom-nav'

import { useDebouncedCallback } from '../model/use-debounced-callback'
import { IssueFilterTabs } from './issue-filter-tabs'
import { IssueList } from './issue-list'
import { IssueSearch } from './issue-search'
import css from './issues-page.module.scss'

const route = getRouteApi('/issues')

export const IssuesPage = () => {
  const { t } = useLingui()
  const { status } = route.useSearch()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
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
      <BottomNav active='/issues' />
    </>
  )
}
