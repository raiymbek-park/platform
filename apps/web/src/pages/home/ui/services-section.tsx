import type { ReactNode } from 'react'

import { useLingui } from '@lingui/react/macro'
import { ActionCard, SectionHeader } from '@raiymbek-park/ui'
import { Link } from '@tanstack/react-router'

import css from './services-section.module.scss'

type ExternalLinkProps = {
  children: ReactNode
  href: string
}

const ExternalLink = ({ children, href }: ExternalLinkProps) => (
  <li>
    <a
      className={css.link}
      href={href}
      rel='noopener noreferrer'
      target='_blank'
    >
      {children}
    </a>
  </li>
)

export const ServicesSection = () => {
  const { t } = useLingui()

  return (
    <section className={css.section}>
      <SectionHeader
        description={t`Заявки, объявления и связь с управляющей компанией`}
        title={t`Сервисы`}
      />
      <ul className={css.list}>
        <li>
          <Link className={css.link} to='/announcements'>
            <ActionCard
              description={t`Новости и уведомления от УК`}
              glyph='megaphone'
              title={t`Объявления`}
              tone='accent'
            />
          </Link>
        </li>
        <li>
          <Link className={css.link} to='/issues/new'>
            <ActionCard
              description={t`Подайте обращение в УК`}
              glyph='clipboard-list'
              title={t`Создать заявку`}
              tone='brand'
            />
          </Link>
        </li>
        <li>
          <Link className={css.link} search={{ status: 'all' }} to='/issues'>
            <ActionCard
              description={t`Отслеживайте ход ваших обращений`}
              glyph='list-checks'
              title={t`Статус заявки`}
              tone='warning'
            />
          </Link>
        </li>
        <li>
          <Link className={css.link} to='/announcements'>
            <ActionCard
              description={t`У вас есть предложение или поиск, пишите сюда`}
              glyph='shopping-bag'
              title={t`Создать объявление`}
              tone='info'
            />
          </Link>
        </li>
        <ExternalLink href='https://chat.whatsapp.com/C9lxfazl3TH73LW7QtE2HI'>
          <ActionCard
            description={t`Вступить в общий чат жильцов`}
            glyph='message-circle'
            title={t`Чат дома в WhatsApp`}
            tone='brand'
          />
        </ExternalLink>
      </ul>
    </section>
  )
}
