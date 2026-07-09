import type { IssueStatus } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'

import { SelectField } from '@/shared/form'

import { useStatusOptions } from '../model/use-status-options'

export type StatusSelectProps = {
  value: IssueStatus | null
  onSelect: (value: IssueStatus) => void
}

export const StatusSelect = ({ value, onSelect }: StatusSelectProps) => {
  const { t } = useLingui()
  const options = useStatusOptions()

  return (
    <SelectField
      isSelected={status => status === value}
      label={t`Новый статус`}
      options={options}
      onSelect={onSelect}
    />
  )
}
