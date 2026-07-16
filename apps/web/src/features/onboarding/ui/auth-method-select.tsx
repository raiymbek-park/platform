import type { IconGlyph, SelectOptionTone } from '@raiymbek-park/ui'
import type { AuthMethod } from '../model/use-auth-method-store'

import { Trans, useLingui } from '@lingui/react/macro'
import { Divider, SelectOption } from '@raiymbek-park/ui'
import { Fragment } from 'react'

import css from './auth-method-select.module.scss'

const displayOrder: AuthMethod[] = ['phone', 'google', 'facebook']

const methodIcons: Record<AuthMethod, IconGlyph> = {
  facebook: 'facebook',
  google: 'google',
  phone: 'phone',
}

const methodTones: Record<AuthMethod, SelectOptionTone> = {
  facebook: 'info',
  google: 'warning',
  phone: 'brand',
}

export type AuthMethodSelectProps = {
  value: AuthMethod
  onSelect: (method: AuthMethod) => void
}

export const AuthMethodSelect = ({
  value,
  onSelect,
}: AuthMethodSelectProps) => {
  const { t } = useLingui()

  const methodLabels: Record<AuthMethod, string> = {
    facebook: 'Facebook',
    google: 'Google',
    phone: t`По номеру телефона`,
  }

  const methodSubtitles: Record<AuthMethod, string> = {
    facebook: t`Быстрый вход с аккаунтом`,
    google: t`Быстрый вход с аккаунтом`,
    phone: t`Только для операторов Kcell/Activ`,
  }

  return (
    <fieldset className={css.card}>
      <legend className='sr-only'>
        <Trans>Способ входа</Trans>
      </legend>
      {displayOrder.map((method, index) => (
        <Fragment key={method}>
          {index > 0 && <Divider />}
          <SelectOption
            icon={methodIcons[method]}
            isSelected={value === method}
            label={methodLabels[method]}
            subtitle={methodSubtitles[method]}
            tone={methodTones[method]}
            onClick={() => onSelect(method)}
          />
        </Fragment>
      ))}
    </fieldset>
  )
}
