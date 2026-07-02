import { Trans, useLingui } from '@lingui/react/macro'
import { ContactCard, Divider, SectionHeader } from '@raiymbek-park/ui'
import { Fragment } from 'react'

import { useServiceContactsData } from '../model/use-service-contacts-data'
import css from './contacts-section.module.scss'

export const ContactsSection = () => {
  const { t } = useLingui()
  const { data, isError, isLoading } = useServiceContactsData()

  return (
    <section className={css.section}>
      <SectionHeader title={t`Аварийные контакты`} />
      {isLoading && (
        <p className={css.state}>
          <Trans>Загрузка…</Trans>
        </p>
      )}
      {isError && (
        <p className={css.state}>
          <Trans>Не удалось загрузить контакты</Trans>
        </p>
      )}
      {data && data.length > 0 && (
        <div className={css.card}>
          {data.map((contact, index) => (
            <Fragment key={contact.id}>
              {index > 0 && <Divider />}
              <a className={css.link} href={`tel:${contact.phone}`}>
                <ContactCard
                  glyph={contact.glyph}
                  name={contact.name}
                  role={contact.role}
                  tone={contact.tone}
                />
              </a>
            </Fragment>
          ))}
        </div>
      )}
    </section>
  )
}
