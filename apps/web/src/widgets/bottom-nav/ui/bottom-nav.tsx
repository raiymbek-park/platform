import type { IssueSearch } from '@raiymbek-park/shared/validation-schemas'
import type { IconGlyph } from '@raiymbek-park/ui'

import { useLingui } from '@lingui/react/macro'
import { NavItem } from '@raiymbek-park/ui'
import { Link } from '@tanstack/react-router'

import css from './bottom-nav.module.scss'

export type NavTab = '/home' | '/announcements' | '/issues' | '/settings'

type Tab = {
  glyph: IconGlyph
  label: string
} & ({ to: NavTab; search?: IssueSearch } | { href: string })

export type BottomNavProps = {
  active: NavTab
}

export const BottomNav = ({ active }: BottomNavProps) => {
  const { t } = useLingui()

  const tabs: Tab[] = [
    { glyph: 'house', label: t`Главная`, to: '/home' },
    { glyph: 'megaphone', label: t`Объявления`, to: '/announcements' },
    {
      glyph: 'clipboard-list',
      label: t`Заявки`,
      search: { status: 'all' },
      to: '/issues',
    },
    { glyph: 'settings', label: t`Настройки`, to: '/settings' },
  ]

  return (
    <nav className={css.nav}>
      {tabs.map(tab =>
        'href' in tab ? (
          <a
            key={tab.href}
            className={css.link}
            href={tab.href}
            rel='noopener noreferrer'
            target='_blank'
          >
            <NavItem glyph={tab.glyph} label={tab.label} />
          </a>
        ) : (
          <Link
            key={tab.to}
            className={css.link}
            search={tab.search}
            to={tab.to}
          >
            <NavItem
              glyph={tab.glyph}
              isActive={tab.to === active}
              label={tab.label}
            />
          </Link>
        ),
      )}
    </nav>
  )
}
