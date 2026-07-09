import { useState } from 'react'

import { useDebouncedCallback } from './use-debounced-callback'

export const useDebouncedSearch = (delay = 300) => {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedCallback({ callback: setSearch, delay })

  const handleSearch = (value: string) => {
    setQuery(value)
    debouncedSearch(value)
  }

  return { handleSearch, query, search }
}
