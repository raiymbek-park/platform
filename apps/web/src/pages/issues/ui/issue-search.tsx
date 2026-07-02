import type { ChangeEvent } from 'react'

import { useLingui } from '@lingui/react/macro'
import { Input } from '@raiymbek-park/ui'

export type IssueSearchProps = {
  onChange: (value: string) => void
  value: string
}

export const IssueSearch = ({ onChange, value }: IssueSearchProps) => {
  const { t } = useLingui()
  return (
    <Input
      aria-label={t`Поиск по заявкам`}
      data-testid='issue-search'
      icon='search'
      placeholder={t`Поиск по заявкам`}
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.value)
      }
    />
  )
}
