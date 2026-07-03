export const SEARCH_MIN_CHARS = 3

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
