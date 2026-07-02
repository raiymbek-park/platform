import type { IssueView } from './use-issues-data'

export const matchIssue = (issue: IssueView, query: string): boolean => {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return (
    issue.title.toLowerCase().includes(needle) ||
    issue.description.toLowerCase().includes(needle) ||
    String(issue.number).includes(needle)
  )
}
