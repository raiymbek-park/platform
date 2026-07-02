import type { ReactNode } from 'react'

import { useLingui } from '@lingui/react/macro'
import { ActionCard, SectionHeader } from '@raiymbek-park/ui'

import css from './services-section.module.scss'

type ServiceLinkProps = {
  children: ReactNode
  url: string
}

const ServiceLink = ({ children, url }: ServiceLinkProps) => {
  const isExternal = url.startsWith('http')

  return (
    <li>
      <a
        className={css.link}
        href={url}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        target={isExternal ? '_blank' : undefined}
      >
        {children}
      </a>
    </li>
  )
}

export const ServicesSection = () => {
  const { t } = useLingui()

  return (
    <section className={css.section}>
      <SectionHeader
        description={t`Заявки, объявления и связь с управляющей компанией`}
        title={t`Сервисы`}
      />
      <ul className={css.list}>
        <ServiceLink url='/announcements'>
          <ActionCard
            description={t`Новости и уведомления от УК`}
            glyph='megaphone'
            title={t`Объявления`}
            tone='accent'
          />
        </ServiceLink>
        <ServiceLink url='https://forms.gle/TEQ88tykp8K2MjfQ9'>
          <ActionCard
            description={t`Подайте обращение в УК`}
            glyph='clipboard-list'
            title={t`Создать заявку`}
            tone='brand'
          />
        </ServiceLink>
        <ServiceLink url='https://trello.com/b/O9Sh7i6z'>
          <ActionCard
            description={t`Отслеживайте ход ваших обращений`}
            glyph='list-checks'
            title={t`Статус заявки`}
            tone='warning'
          />
        </ServiceLink>
        <ServiceLink url='/announcements'>
          <ActionCard
            description={t`У вас есть предложение или поиск, пишите сюда`}
            glyph='shopping-bag'
            title={t`Создать объявление`}
            tone='info'
          />
        </ServiceLink>
        <ServiceLink url='https://chat.whatsapp.com/C9lxfazl3TH73LW7QtE2HI'>
          <ActionCard
            description={t`Вступить в общий чат жильцов`}
            glyph='message-circle'
            title={t`Чат дома в WhatsApp`}
            tone='brand'
          />
        </ServiceLink>
      </ul>
    </section>
  )
}
