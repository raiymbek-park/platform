import { useLingui } from '@lingui/react/macro'

import { SearchField } from '@/shared/form'

export type IssueSearchProps = {
  onChange: (value: string) => void
  value: string
}

export const IssueSearch = ({ onChange, value }: IssueSearchProps) => {
  const { t } = useLingui()
  return (
    <SearchField
      aria-label={t`Поиск по заявкам`}
      clearLabel={t`Очистить поиск`}
      data-testid='issue-search'
      placeholder={t`Поиск по заявкам, от 2 символов`}
      value={value}
      onChange={onChange}
    />
  )
}
