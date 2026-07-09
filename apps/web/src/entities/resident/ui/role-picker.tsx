import type { Role } from '@raiymbek-park/shared/validation-schemas'

import { Trans, useLingui } from '@lingui/react/macro'
import { Divider, SelectOption } from '@raiymbek-park/ui'

import css from './fields.module.scss'

export type RolePickerProps = {
  disabled?: boolean
  value: Role | null
  onChange: (role: Role) => void
}

export const RolePicker = ({ disabled, value, onChange }: RolePickerProps) => {
  const { t } = useLingui()

  return (
    <fieldset className={css.group} disabled={disabled}>
      <legend className='sr-only'>
        <Trans>Роль</Trans>
      </legend>
      <div className={css.card}>
        <SelectOption
          icon='house'
          isSelected={value === 'owner'}
          label={t`Собственник квартиры`}
          subtitle={t`Владею жильём`}
          tone='brand'
          onClick={() => onChange('owner')}
        />
        <Divider />
        <SelectOption
          icon='key-round'
          isSelected={value === 'tenant'}
          label={t`Арендатор`}
          subtitle={t`Снимаю жильё`}
          tone='danger'
          onClick={() => onChange('tenant')}
        />
      </div>
    </fieldset>
  )
}
