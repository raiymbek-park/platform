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

import { usePostActionsAccess } from '../model/use-post-actions-access'
import { PostFilterTabs } from './post-filter-tabs'
import { PostList } from './post-list'
import { PostSearch } from './post-search'

const route = getRouteApi('/posts/')

export const PostsPage = () => {
  const { t } = useLingui()
  const { tab } = route.useSearch()
  const { canCreate } = usePostActionsAccess()
  const { handleSearch, query, search } = useDebouncedSearch()
  const isScrollingDown = useScrollDirection()

  return (
    <>
      <ScreenHeader />
      <Content gap={16}>
        <ScreenTitle
          subtitle={t`Новостная лента и частные объявления от жильцов.`}
          title={t`Объявления`}
        />
        <PostSearch value={query} onChange={handleSearch} />
        <PostFilterTabs />
        <PostList query={query} search={search} tab={tab} />
      </Content>
      {canCreate && (
        <Link
          aria-hidden={isScrollingDown || undefined}
          aria-label={t`Новое объявление`}
          tabIndex={isScrollingDown ? -1 : undefined}
          to='/posts/new'
        >
          <CreateFab isHidden={isScrollingDown} />
        </Link>
      )}
      <BottomNav active='/posts' />
    </>
  )
}
