import { useLingui } from '@lingui/react/macro'
import { ActionCard, SectionHeader } from '@raiymbek-park/ui'
import { Link } from '@tanstack/react-router'

import css from './services-section.module.scss'

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
          <Link className={css.link} search={{ tab: 'all' }} to='/posts'>
            <ActionCard
              description={t`Новости, уведомления и частные предложения`}
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
          <Link className={css.link} to='/posts/new'>
            <ActionCard
              description={t`У вас есть предложение или поиск, пишите сюда`}
              glyph='shopping-bag'
              title={t`Создать объявление`}
              tone='info'
            />
          </Link>
        </li>
      </ul>
    </section>
  )
}
