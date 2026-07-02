import type { NavTab } from '@/widgets/bottom-nav'

import { Trans } from '@lingui/react/macro'
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
      <p className={css.note}>
        <Trans>Раздел в разработке</Trans>
      </p>
    </Content>
    <BottomNav active={active} />
  </>
)
