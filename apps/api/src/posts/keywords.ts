import { searchPrefixes, tokenize } from '@raiymbek-park/shared'

export const buildPostKeywords = (titles: string[]): string[] => [
  ...new Set(titles.flatMap(tokenize).flatMap(searchPrefixes)),
]
