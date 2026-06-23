import type { NavTab } from '@/widgets/bottom-nav'

import { Content } from '@raiymbek-park/ui'

import { BottomNav } from '@/widgets/bottom-nav'

import css from './placeholder-page.module.scss'

export type PlaceholderPageProps = {
  active: NavTab
  title: string
}

export const PlaceholderPage = ({ active, title }: PlaceholderPageProps) => (
  <>
    <Content className={css.body}>
      <h1 className={css.title}>{title}</h1>
      <p className={css.note}>Раздел в разработке</p>
    </Content>
    <BottomNav active={active} />
  </>
)
