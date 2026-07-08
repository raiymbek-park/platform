import { searchPrefixes, tokenize } from '@raiymbek-park/shared'

export const buildKeywords = ({
  number,
  titles,
}: {
  number: number
  titles: string[]
}): string[] => [
  ...new Set(
    [...titles.flatMap(tokenize), String(number)].flatMap(searchPrefixes),
  ),
]
