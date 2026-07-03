import type { IssueView } from './use-issues-data'

import { searchTerms } from '@raiymbek-park/shared'

export const matchIssue = (issue: IssueView, query: string): boolean => {
  const terms = searchTerms(query)
  if (!terms.length) return true
  return terms.some(term => issue.keywords.includes(term))
}
