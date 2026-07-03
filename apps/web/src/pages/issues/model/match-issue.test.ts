import type { IssueView } from './use-issues-data'

import { expect, test } from 'vitest'

import { matchIssue } from './match-issue'

const issueView = (keywords: string[]): IssueView => ({
  apartment: 1,
  authorName: '',
  block: 1,
  category: 'other',
  commentCount: 0,
  createdAt: 0,
  description: '',
  dislikeCount: 0,
  id: 'issue-1',
  keywords,
  likeCount: 0,
  media: [],
  myReaction: null,
  number: 115,
  status: 'new',
  tags: [],
  title: '',
  urgent: false,
})

test('matches when a search term is one of the issue keywords', () => {
  expect(matchIssue(issueView(['лиф', 'лифт', 'лифта', '115']), 'лиф')).toBe(
    true,
  )
})

test('matches by issue number', () => {
  expect(matchIssue(issueView(['лифта', '115']), '115')).toBe(true)
})

test('does not match when no term is among the keywords', () => {
  expect(matchIssue(issueView(['лифта', '115']), 'домофон')).toBe(false)
})

test('an empty query matches every issue', () => {
  expect(matchIssue(issueView([]), '')).toBe(true)
})

test('a query shorter than three characters matches every issue', () => {
  expect(matchIssue(issueView(['лифта']), 'ли')).toBe(true)
})

test('matches when any one of several terms is a keyword', () => {
  expect(matchIssue(issueView(['лифта']), 'лифта ззз')).toBe(true)
})

test('requires the whole term, not a keyword that merely extends it', () => {
  expect(matchIssue(issueView(['лифта']), 'лифт')).toBe(false)
})
