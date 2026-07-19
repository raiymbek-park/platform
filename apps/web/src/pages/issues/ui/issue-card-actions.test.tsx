import type { PermissionRole } from '@raiymbek-park/shared/validation-schemas'

import {
  fake,
  injectFake,
  resetFirestore,
  Timestamp,
} from '@raiymbek-park/api/testing'
import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { firebaseAuth } from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

if (!URL.createObjectURL)
  Object.assign(URL, {
    createObjectURL: () => 'blob:x',
    revokeObjectURL: () => {},
  })

const seedResident = (role: PermissionRole) =>
  fake.seed('residents/uid-1', {
    apartment: 42,
    avatarUrl: null,
    block: 1,
    cars: [],
    isPhoneVisible: false,
    name: 'Alice',
    phone: '+77781234455',
    role,
  })

const seedIssue = (overrides: Record<string, unknown> = {}) =>
  fake.seed('issues/issue-301', {
    author: { apartment: 12, block: 1, name: 'George Lucas' },
    authorId: 'author-uid',
    category: 'other',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1_700_000_000_000),
    description: "The entrance intercom won't open the door with a key",
    keywords: [],
    lang: 'ru',
    media: [],
    number: 301,
    reactions: {},
    status: 'in-progress',
    tags: [],
    title: 'The intercom is broken',
    urgent: false,
    ...overrides,
  })

const expandCard = async (
  user: ReturnType<typeof renderAppWithServer>['user'],
) => {
  const [element] = await screen.findAllByRole('article')
  if (!element) throw new Error('no card rendered')
  await user.click(within(element).getByRole('button', { name: /Details/ }))
  return element
}

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  fake.reset()
  injectFake()
})

afterEach(resetFirestore)

test('permissions: a Manager sees the change-status action and it opens the status screen', async () => {
  seedResident('manager')
  seedIssue()
  const { currentPath, user } = renderAppWithServer('/issues?status=all', {
    uid: 'uid-1',
  })
  await screen.findByText('The intercom is broken')

  const card = await expandCard(user)
  expect(
    within(card).queryByRole('button', { name: 'Edit' }),
  ).not.toBeInTheDocument()

  await user.click(within(card).getByRole('button', { name: 'Change status' }))
  await waitFor(() => expect(currentPath()).toBe('/issues/status/issue-301'))
})

test('permissions: a Resident sees no change-status action', async () => {
  seedResident('resident')
  seedIssue()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('The intercom is broken')

  const card = await expandCard(user)
  expect(
    within(card).queryByRole('button', { name: 'Change status' }),
  ).not.toBeInTheDocument()
})

test('permissions: an Administration user sees the change-status action', async () => {
  seedResident('administration')
  seedIssue()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('The intercom is broken')

  const card = await expandCard(user)
  expect(
    within(card).getByRole('button', { name: 'Change status' }),
  ).toBeInTheDocument()
})

test('permissions: the edit action on an own new issue opens the edit screen', async () => {
  seedResident('resident')
  seedIssue({ authorId: 'uid-1', status: 'new' })
  const { currentPath, user } = renderAppWithServer('/issues?status=all', {
    uid: 'uid-1',
  })
  await screen.findByText('The intercom is broken')

  const card = await expandCard(user)
  await user.click(within(card).getByRole('button', { name: 'Edit' }))
  await waitFor(() => expect(currentPath()).toBe('/issues/edit/issue-301'))
})
