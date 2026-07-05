import type { Issue } from '@raiymbek-park/api'

import { useLingui } from '@lingui/react/macro'
import { Carousel, Icon, IconChip } from '@raiymbek-park/ui'

import { statusGlyphs, statusTones } from '@/shared/issue'

import { useStatusOptions } from '../model/use-status-options'
import css from './issue-summary.module.scss'

export type IssueSummaryProps = {
  issue: Issue
}

export const IssueSummary = ({ issue }: IssueSummaryProps) => {
  const { t } = useLingui()
  const options = useStatusOptions()
  const label = options.find(option => option.value === issue.status)?.label

  return (
    <article className={css.summary}>
      {issue.media.length > 0 && (
        <div className={css.media}>
          <Carousel
            items={issue.media.map(url => ({ id: url, url }))}
            showDots
          />
        </div>
      )}
      <div className={css.body}>
        <header className={css.head}>
          <IconChip
            glyph={statusGlyphs[issue.status]}
            iconSize={20}
            size={40}
            tone={statusTones[issue.status]}
          />
          <div className={css.titleBlock}>
            <h3 className={css.title}>{issue.title}</h3>
            <span className={css.meta}>
              {t`Заявка №${issue.number} · ${label}`}
            </span>
          </div>
        </header>
        <div className={css.contact}>
          <Icon className={css.contactIcon} glyph='user-round' size={16} />
          <span className={css.name}>{issue.author.name}</span>
        </div>
      </div>
    </article>
  )
}
