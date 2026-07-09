import type { PostKind } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { FilterTab } from '@raiymbek-park/ui'

import css from './kind-switcher.module.scss'

export type KindSwitcherProps = {
  kind: PostKind
  onChange: (kind: PostKind) => void
}

export const KindSwitcher = ({ kind, onChange }: KindSwitcherProps) => {
  const { t } = useLingui()

  return (
    <fieldset className={css.switcher}>
      <legend className='sr-only'>{t`Тип объявления`}</legend>
      <FilterTab
        isActive={kind === 'offer'}
        label={t`Частное объявление`}
        onClick={() => onChange('offer')}
      />
      <FilterTab
        isActive={kind === 'announcement'}
        label={t`Уведомление`}
        onClick={() => onChange('announcement')}
      />
    </fieldset>
  )
}
