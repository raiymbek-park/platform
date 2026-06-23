import type { IconGlyph } from '@raiymbek-park/ui'

import { NavItem } from '@raiymbek-park/ui'
import { Link } from '@tanstack/react-router'

import css from './bottom-nav.module.scss'

export type NavTab = '/home' | '/announcements' | '/requests' | '/settings'

type Tab = {
  glyph: IconGlyph
  label: string
  to: NavTab
}

const tabs: Tab[] = [
  { glyph: 'house', label: 'Главная', to: '/home' },
  { glyph: 'megaphone', label: 'Объявления', to: '/announcements' },
  { glyph: 'clipboard-list', label: 'Заявки', to: '/requests' },
  { glyph: 'settings', label: 'Настройки', to: '/settings' },
]

export type BottomNavProps = {
  active: NavTab
}

export const BottomNav = ({ active }: BottomNavProps) => (
  <nav className={css.nav}>
    {tabs.map(tab => (
      <Link key={tab.to} className={css.link} to={tab.to}>
        <NavItem
          glyph={tab.glyph}
          isActive={tab.to === active}
          label={tab.label}
        />
      </Link>
    ))}
  </nav>
)
