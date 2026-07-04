import type { Issue } from '@raiymbek-park/api'

import { issueDeleteInputSchema } from '@raiymbek-park/shared/validation-schemas'
import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import {
  firebaseAuth,
  renderApp,
  trpcMutation,
  trpcMutationError,
  trpcQueries,
  trpcServer,
} from '@/shared/test'

if (!HTMLDialogElement.prototype.showModal)
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }

const seedIssue: Issue = {
  author: { apartment: 42, block: 1, name: 'Алиса' },
  category: 'other',
  commentCount: 0,
  createdAt: 1000,
  description: 'Течёт кран уже неделю',
  dislikeCount: 0,
  id: 'issue-201',
  isMine: true,
  keywords: ['кран'],
  likeCount: 0,
  media: [],
  myReaction: null,
  number: 201,
  status: 'new',
  tags: [],
  title: 'Течёт кран на кухне',
  urgent: false,
}

let issues: Issue[] = [seedIssue]

const serveList = () =>
  trpcQueries({
    'issues.list': () => ({ issues, nextCursor: null }),
    'resident.me': () => ({
      apartment: 42,
      block: 1,
      name: 'Алиса',
      role: 'resident',
    }),
  })

const serve = () =>
  trpcServer.use(
    serveList(),
    trpcMutation('issues.delete', raw => {
      const { issueId } = issueDeleteInputSchema.parse(raw)
      issues = issues.filter(issue => issue.id !== issueId)
      return { ok: true }
    }),
  )

const card = async () => {
  const [element] = await screen.findAllByRole('article')
  if (!element) throw new Error('no card rendered')
  return element
}

const openDeleteConfirm = async (
  user: ReturnType<typeof renderApp>['user'],
) => {
  const cardElement = await card()
  await user.click(
    within(cardElement).getByRole('button', { name: /Подробнее/ }),
  )
  await user.click(within(cardElement).getByRole('button', { name: 'Удалить' }))
  return within(await screen.findByRole('dialog')).getByRole('button', {
    name: 'Удалить',
  })
}

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  issues = [{ ...seedIssue }]
})

test('happy-path 10: confirming delete on an own new issue removes it from the list with a success toast', async () => {
  serve()
  const { user } = renderApp('/issues?status=all')
  await screen.findByText('Течёт кран на кухне')

  const confirmButton = await openDeleteConfirm(user)
  await user.click(confirmButton)

  expect(await screen.findByText('Заявка удалена.')).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.queryByText('Течёт кран на кухне')).not.toBeInTheDocument(),
  )
})

test('error-states 6: a failed delete rolls back and shows an error toast, keeping the issue in the list', async () => {
  serve()
  const { user } = renderApp('/issues?status=all')
  await screen.findByText('Течёт кран на кухне')

  const confirmButton = await openDeleteConfirm(user)
  trpcServer.use(trpcMutationError('issues.delete'))
  await user.click(confirmButton)

  expect(
    await screen.findByText('Не удалось удалить заявку. Попробуйте ещё раз.'),
  ).toBeInTheDocument()
  expect(screen.getByText('Течёт кран на кухне')).toBeInTheDocument()
})

test('error-states 8: a NOT_FOUND delete error is treated as already deleted, keeping the issue removed with a success toast', async () => {
  serve()
  const { user } = renderApp('/issues?status=all')
  await screen.findByText('Течёт кран на кухне')

  const confirmButton = await openDeleteConfirm(user)
  trpcServer.use(trpcMutationError('issues.delete', 'NOT_FOUND', 404))
  issues = issues.filter(issue => issue.id !== seedIssue.id)
  await user.click(confirmButton)

  expect(await screen.findByText('Заявка удалена.')).toBeInTheDocument()
  expect(screen.queryByText('Течёт кран на кухне')).not.toBeInTheDocument()
})

test('edge-cases 9: an issue past the New status shows no delete action on its card', async () => {
  issues = [{ ...seedIssue, status: 'in-progress' }]
  serve()
  const { user } = renderApp('/issues?status=all')
  await screen.findByText('Течёт кран на кухне')

  const cardElement = await card()
  await user.click(
    within(cardElement).getByRole('button', { name: /Подробнее/ }),
  )

  expect(
    within(cardElement).queryByRole('button', { name: 'Удалить' }),
  ).not.toBeInTheDocument()
})
