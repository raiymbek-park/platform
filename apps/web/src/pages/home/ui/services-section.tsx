import { SectionHeader, ServiceItem } from '@raiymbek-park/ui'

import { useServicesData } from '../model/use-services-data'
import css from './services-section.module.scss'

export const ServicesSection = () => {
  const { data, isError, isLoading } = useServicesData()

  return (
    <section className={css.section}>
      <SectionHeader
        description='Заявки, объявления и связь с управляющей компанией'
        title='Сервисы'
      />
      {isLoading && <p className={css.state}>Загрузка…</p>}
      {isError && <p className={css.state}>Не удалось загрузить сервисы</p>}
      {data && data.length > 0 && (
        <ul className={css.list}>
          {data.map(service => {
            const isExternal = service.url.startsWith('http')

            return (
              <li key={service.id}>
                <a
                  className={css.link}
                  href={service.url}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  target={isExternal ? '_blank' : undefined}
                >
                  <ServiceItem
                    description={service.description}
                    glyph={service.glyph}
                    title={service.title}
                    tone={service.tone}
                  />
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
