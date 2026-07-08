import { searchPrefixes, tokenize } from '@raiymbek-park/shared'

export const buildPostKeywords = (title: string): string[] => [
  ...new Set(tokenize(title).flatMap(searchPrefixes)),
]
