import type { ReactNode } from 'react'

import { SectionHeader, ServiceItem } from '@raiymbek-park/ui'

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

export const ServicesSection = () => (
  <section className={css.section}>
    <SectionHeader
      description='Заявки, объявления и связь с управляющей компанией'
      title='Сервисы'
    />
    <ul className={css.list}>
      <ServiceLink url='/announcements'>
        <ServiceItem
          description='Новости и уведомления от УК'
          glyph='megaphone'
          title='Объявления'
          tone='danger'
        />
      </ServiceLink>
      <ServiceLink url='https://forms.gle/TEQ88tykp8K2MjfQ9'>
        <ServiceItem
          description='Подать обращение без регистрации'
          glyph='zap'
          title='Быстрая заявка'
          tone='brand'
        />
      </ServiceLink>
      <ServiceLink url='https://forms.gle/dPdJYfFpQic2r6YS8'>
        <ServiceItem
          description='Опишите проблему с фото или видео'
          glyph='camera'
          title='Заявка с медиа'
          tone='info'
        />
      </ServiceLink>
      <ServiceLink url='https://trello.com/b/O9Sh7i6z'>
        <ServiceItem
          description='Отслеживайте ход ваших обращений'
          glyph='list-checks'
          title='Статус заявки'
          tone='accent'
        />
      </ServiceLink>
      <ServiceLink url='https://chat.whatsapp.com/C9lxfazl3TH73LW7QtE2HI'>
        <ServiceItem
          description='Вступить в общий чат жильцов'
          glyph='message-circle'
          title='Чат дома в WhatsApp'
          tone='brand'
        />
      </ServiceLink>
    </ul>
  </section>
)
