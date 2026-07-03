import { SEARCH_MIN_CHARS, tokenize } from '@raiymbek-park/shared'

const prefixes = (word: string): string[] =>
  word.length <= SEARCH_MIN_CHARS
    ? [word]
    : Array.from({ length: word.length - SEARCH_MIN_CHARS + 1 }, (_, index) =>
        word.slice(0, SEARCH_MIN_CHARS + index),
      )

export const buildKeywords = ({
  number,
  titles,
}: {
  number: number
  titles: string[]
}): string[] => [
  ...new Set([...titles.flatMap(tokenize), String(number)].flatMap(prefixes)),
]
