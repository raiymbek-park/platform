import type { PermissionRole } from '@raiymbek-park/shared/validation-schemas'

import {
  fake,
  injectFake,
  resetFirestore,
  Timestamp,
} from '@raiymbek-park/api/testing'
import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { firebaseAuth, trpcMutationError, trpcServer } from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

import { useStoreDeletedIssues } from '../model/use-store-deleted-issues'

if (!HTMLDialogElement.prototype.showModal)
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }

const seedResident = (role: PermissionRole = 'resident') =>
  fake.seed('residents/uid-1', {
    apartment: 42,
    avatarUrl: null,
    block: 1,
    cars: [],
    isPhoneVisible: false,
    name: 'Алиса',
    phone: '+77781234455',
    role,
  })

const seedIssue = (overrides: Record<string, unknown> = {}) =>
  fake.seed('issues/issue-201', {
    author: { apartment: 42, block: 1, name: 'Алиса' },
    authorId: 'uid-1',
    category: 'other',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1000),
    description: 'Течёт кран уже неделю',
    keywords: ['кран'],
    lang: 'ru',
    media: [],
    number: 201,
    reactions: {},
    status: 'new',
    tags: [],
    title: 'Течёт кран на кухне',
    urgent: false,
    ...overrides,
  })

const card = async () => {
  const [element] = await screen.findAllByRole('article')
  if (!element) throw new Error('no card rendered')
  return element
}

const openDeleteConfirm = async (
  user: ReturnType<typeof renderAppWithServer>['user'],
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
  fake.reset()
  injectFake()
  useStoreDeletedIssues.setState({ deletedIds: new Set() })
})

afterEach(resetFirestore)

test('happy-path 10: confirming delete on an own new issue runs the real delete — it leaves the datastore and the list with a success toast', async () => {
  seedResident()
  seedIssue()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Течёт кран на кухне')

  const confirmButton = await openDeleteConfirm(user)
  await user.click(confirmButton)

  expect(await screen.findByText('Заявка удалена.')).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.queryByText('Течёт кран на кухне')).not.toBeInTheDocument(),
  )
  expect(fake.getDoc('issues/issue-201')).toBeUndefined()
})

test('error-states 6: a failed delete rolls back and shows an error toast, keeping the issue stored and listed', async () => {
  seedResident()
  seedIssue()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Течёт кран на кухне')

  const confirmButton = await openDeleteConfirm(user)
  trpcServer.use(trpcMutationError('issues.delete'))
  await user.click(confirmButton)

  expect(
    await screen.findByText('Не удалось удалить заявку. Попробуйте ещё раз.'),
  ).toBeInTheDocument()
  expect(screen.getByText('Течёт кран на кухне')).toBeInTheDocument()
  expect(fake.getDoc('issues/issue-201')).toBeDefined()
})

test('error-states 8: a NOT_FOUND from the real backend is treated as already deleted, keeping the issue removed with a success toast', async () => {
  seedResident()
  seedIssue()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Течёт кран на кухне')

  const confirmButton = await openDeleteConfirm(user)
  fake.reset()
  seedResident()
  await user.click(confirmButton)

  expect(await screen.findByText('Заявка удалена.')).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.queryByText('Течёт кран на кухне')).not.toBeInTheDocument(),
  )
})

test('edge-cases 9: an issue past the New status shows no delete action on its card', async () => {
  seedResident()
  seedIssue({ status: 'in-progress' })
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Течёт кран на кухне')

  const cardElement = await card()
  await user.click(
    within(cardElement).getByRole('button', { name: /Подробнее/ }),
  )

  expect(
    within(cardElement).queryByRole('button', { name: 'Удалить' }),
  ).not.toBeInTheDocument()
})

test('happy-path 11: an Administration user can delete a new issue opened by someone else', async () => {
  seedResident('administration')
  seedIssue({ authorId: 'author-uid' })
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Течёт кран на кухне')

  const confirmButton = await openDeleteConfirm(user)
  await user.click(confirmButton)

  expect(await screen.findByText('Заявка удалена.')).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.queryByText('Течёт кран на кухне')).not.toBeInTheDocument(),
  )
  expect(fake.getDoc('issues/issue-201')).toBeUndefined()
})

test('validation 12: a Resident sees no delete action on an issue opened by someone else', async () => {
  seedResident('resident')
  seedIssue({ authorId: 'author-uid' })
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Течёт кран на кухне')

  const cardElement = await card()
  await user.click(
    within(cardElement).getByRole('button', { name: /Подробнее/ }),
  )

  expect(
    within(cardElement).queryByRole('button', { name: 'Удалить' }),
  ).not.toBeInTheDocument()
})
