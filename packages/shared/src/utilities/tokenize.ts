export const SEARCH_MIN_CHARS = 2

export const tokenize = (text: string): string[] => {
  const words = text
    .normalize('NFC')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
  return [...new Set(words)]
}

export const searchTerms = (query: string): string[] =>
  tokenize(query).filter(term => term.length >= SEARCH_MIN_CHARS)

export const searchPrefixes = (word: string): string[] =>
  word.length <= SEARCH_MIN_CHARS
    ? [word]
    : Array.from({ length: word.length - SEARCH_MIN_CHARS + 1 }, (_, index) =>
        word.slice(0, SEARCH_MIN_CHARS + index),
      )

export const matchKeywords = (keywords: string[], query: string): boolean => {
  const terms = searchTerms(query)
  if (!terms.length) return true
  return terms.some(term => keywords.includes(term))
}
