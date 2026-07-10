import type { Issue } from '@raiymbek-park/api'

import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import { firebaseAuth, renderApp, trpcQueries, trpcServer } from '@/shared/test'

if (!URL.createObjectURL)
  Object.assign(URL, {
    createObjectURL: () => 'blob:x',
    revokeObjectURL: () => {},
  })

type Role = 'resident' | 'manager' | 'administration'

const seedIssue: Issue = {
  author: { apartment: 12, block: 1, name: 'Житель' },
  category: 'other',
  commentCount: 0,
  createdAt: 1_700_000_000_000,
  description: 'Домофон у подъезда не открывает дверь по ключу',
  dislikeCount: 0,
  id: 'issue-301',
  isMine: false,
  isTranslated: false,
  keywords: [],
  likeCount: 0,
  media: [],
  myReaction: null,
  number: 301,
  original: null,
  originalLang: 'ru',
  status: 'in-progress',
  tags: [],
  title: 'Не работает домофон',
  urgent: false,
}

let issue: Issue = seedIssue

const serve = (role: Role) =>
  trpcServer.use(
    trpcQueries({
      'issues.get': () => issue,
      'issues.list': () => ({ issues: [issue], nextCursor: null }),
      'resident.me': () => ({ apartment: 42, block: 1, name: 'Алиса', role }),
    }),
  )

const expandCard = async (user: ReturnType<typeof renderApp>['user']) => {
  const [element] = await screen.findAllByRole('article')
  if (!element) throw new Error('no card rendered')
  await user.click(within(element).getByRole('button', { name: /Подробнее/ }))
  return element
}

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  issue = { ...seedIssue }
})

test('permissions: a Manager sees the change-status action and it opens the status screen', async () => {
  serve('manager')
  const { currentPath, user } = renderApp('/issues?status=all')
  await screen.findByText('Не работает домофон')

  const card = await expandCard(user)
  expect(
    within(card).queryByRole('button', { name: 'Редактировать' }),
  ).not.toBeInTheDocument()

  await user.click(within(card).getByRole('button', { name: 'Сменить статус' }))
  await waitFor(() => expect(currentPath()).toBe('/issues/status/issue-301'))
})

test('permissions: a Resident sees no change-status action', async () => {
  serve('resident')
  const { user } = renderApp('/issues?status=all')
  await screen.findByText('Не работает домофон')

  const card = await expandCard(user)
  expect(
    within(card).queryByRole('button', { name: 'Сменить статус' }),
  ).not.toBeInTheDocument()
})

test('permissions: an Administration user sees the change-status action', async () => {
  serve('administration')
  const { user } = renderApp('/issues?status=all')
  await screen.findByText('Не работает домофон')

  const card = await expandCard(user)
  expect(
    within(card).getByRole('button', { name: 'Сменить статус' }),
  ).toBeInTheDocument()
})

test('permissions: the edit action on an own new issue opens the edit screen', async () => {
  issue = { ...seedIssue, isMine: true, status: 'new' }
  serve('resident')
  const { currentPath, user } = renderApp('/issues?status=all')
  await screen.findByText('Не работает домофон')

  const card = await expandCard(user)
  await user.click(within(card).getByRole('button', { name: 'Редактировать' }))
  await waitFor(() => expect(currentPath()).toBe('/issues/edit/issue-301'))
})
