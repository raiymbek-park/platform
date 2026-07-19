import type {
  IconGlyph,
  SelectCardOption,
  SelectOptionTone,
} from '@raiymbek-park/ui'
import type { AuthMethod } from '../model/use-auth-method-store'

import { Trans, useLingui } from '@lingui/react/macro'
import { SelectCard } from '@raiymbek-park/ui'

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
    <SelectCard
      legend={<Trans>Способ входа</Trans>}
      options={displayOrder.map(
        (method): SelectCardOption => ({
          icon: methodIcons[method],
          isSelected: value === method,
          key: method,
          label: methodLabels[method],
          subtitle: methodSubtitles[method],
          tone: methodTones[method],
          onSelect: () => onSelect(method),
        }),
      )}
    />
  )
}
