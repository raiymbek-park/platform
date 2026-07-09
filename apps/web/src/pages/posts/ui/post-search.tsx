import { useLingui } from '@lingui/react/macro'

import { SearchField } from '@/shared/form'

export type PostSearchProps = {
  onChange: (value: string) => void
  value: string
}

export const PostSearch = ({ onChange, value }: PostSearchProps) => {
  const { t } = useLingui()
  return (
    <SearchField
      aria-label={t`Поиск по объявлениям`}
      clearLabel={t`Очистить поиск`}
      data-testid='post-search'
      placeholder={t`Поиск по объявлениям, от 2 символов`}
      value={value}
      onChange={onChange}
    />
  )
}
