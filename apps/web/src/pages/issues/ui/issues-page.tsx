import { useLingui } from '@lingui/react/macro'
import {
  Content,
  CreateFab,
  ScreenHeader,
  ScreenTitle,
} from '@raiymbek-park/ui'
import { getRouteApi, Link } from '@tanstack/react-router'

import { useDebouncedSearch, useScrollDirection } from '@/shared/lib'
import { BottomNav } from '@/widgets/bottom-nav'

import { IssueFilterTabs } from './issue-filter-tabs'
import { IssueList } from './issue-list'
import { IssueSearch } from './issue-search'

const route = getRouteApi('/issues/')

export const IssuesPage = () => {
  const { t } = useLingui()
  const { status } = route.useSearch()
  const { handleSearch, query, search } = useDebouncedSearch()
  const isScrollingDown = useScrollDirection()

  return (
    <>
      <ScreenHeader />
      <Content gap={16}>
        <ScreenTitle
          subtitle={t`Обращения жильцов в управляющую компанию и их статусы.`}
          title={t`Заявки`}
        />
        <IssueSearch value={query} onChange={handleSearch} />
        <IssueFilterTabs />
        <IssueList query={query} search={search} status={status} />
      </Content>
      <Link
        aria-hidden={isScrollingDown || undefined}
        aria-label={t`Новая заявка`}
        tabIndex={isScrollingDown ? -1 : undefined}
        to='/issues/new'
      >
        <CreateFab isHidden={isScrollingDown} />
      </Link>
      <BottomNav active='/issues' />
    </>
  )
}
