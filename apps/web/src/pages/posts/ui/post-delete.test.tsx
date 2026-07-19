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

if (!HTMLDialogElement.prototype.showModal)
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
if (!HTMLDialogElement.prototype.close)
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
  }

const seedResident = (role: PermissionRole = 'resident') =>
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

const seedPost = (overrides: Record<string, unknown> = {}) =>
  fake.seed('posts/post-201', {
    author: {
      apartment: 12,
      block: 3,
      name: 'Alice',
      phone: '+7 700 000 00 00',
    },
    authorId: 'uid-1',
    category: 'sell',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1000),
    description: 'Selling a bike in excellent condition',
    keywords: ['bike'],
    kind: 'offer',
    lang: 'ru',
    media: [],
    reactions: {},
    title: 'Selling a mountain bike',
    ...overrides,
  })

const card = async () => {
  const [element] = await screen.findAllByRole('article')
  if (!element) throw new Error('no card rendered')
  return element
}

const expandCard = async (
  user: ReturnType<typeof renderAppWithServer>['user'],
  cardElement: HTMLElement,
) => user.click(within(cardElement).getByRole('button', { name: /Details/ }))

const openDeleteConfirm = async (
  user: ReturnType<typeof renderAppWithServer>['user'],
) => {
  const cardElement = await card()
  await expandCard(user, cardElement)
  await user.click(within(cardElement).getByRole('button', { name: 'Delete' }))
  return within(await screen.findByRole('dialog')).getByRole('button', {
    name: 'Delete',
  })
}

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  fake.reset()
  injectFake()
})

afterEach(resetFirestore)

test('happy-path 11: the author confirms delete and the post disappears from the feed', async () => {
  seedResident()
  seedPost()
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Selling a mountain bike')

  const confirmButton = await openDeleteConfirm(user)
  await user.click(confirmButton)

  expect(await screen.findByText('Post deleted.')).toBeInTheDocument()
  await waitFor(() =>
    expect(
      screen.queryByText('Selling a mountain bike'),
    ).not.toBeInTheDocument(),
  )
  expect(fake.getDoc('posts/post-201')).toBeUndefined()
})

test('validation 12: canceling the delete confirmation leaves the post stored and in the feed', async () => {
  seedResident()
  seedPost()
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Selling a mountain bike')

  const cardElement = await card()
  await expandCard(user, cardElement)
  await user.click(within(cardElement).getByRole('button', { name: 'Delete' }))
  const dialog = await screen.findByRole('dialog')
  await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  )
  expect(screen.getByText('Selling a mountain bike')).toBeInTheDocument()
  expect(fake.getDoc('posts/post-201')).toBeDefined()
})

test('error-states 4: a failed delete shows an error toast and keeps the post stored and in the feed', async () => {
  seedResident()
  seedPost()
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Selling a mountain bike')

  const confirmButton = await openDeleteConfirm(user)
  trpcServer.use(trpcMutationError('posts.delete'))
  await user.click(confirmButton)

  expect(
    await screen.findByText('Failed to delete the post. Please try again.'),
  ).toBeInTheDocument()
  expect(screen.getByText('Selling a mountain bike')).toBeInTheDocument()
  expect(fake.getDoc('posts/post-201')).toBeDefined()
})

test('happy-path 12: an Administration user deletes a post authored by someone else', async () => {
  seedResident('administration')
  seedPost({ authorId: 'author-uid' })
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Selling a mountain bike')

  const confirmButton = await openDeleteConfirm(user)
  await user.click(confirmButton)

  expect(await screen.findByText('Post deleted.')).toBeInTheDocument()
  expect(fake.getDoc('posts/post-201')).toBeUndefined()
})

test('happy-path 12: an Administration user can reach edit for a post authored by someone else', async () => {
  seedResident('administration')
  seedPost({ authorId: 'author-uid' })
  const { currentPath, user } = renderAppWithServer('/posts?tab=all', {
    uid: 'uid-1',
  })
  await screen.findByText('Selling a mountain bike')

  const cardElement = await card()
  await expandCard(user, cardElement)
  await user.click(within(cardElement).getByRole('button', { name: 'Edit' }))

  expect(currentPath()).toBe('/posts/edit/post-201')
})

test('edge-cases 6: a Resident sees no edit or delete action on a post authored by someone else', async () => {
  seedResident('resident')
  seedPost({ authorId: 'author-uid' })
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Selling a mountain bike')

  const cardElement = await card()
  await expandCard(user, cardElement)

  expect(
    within(cardElement).queryByRole('button', { name: 'Delete' }),
  ).not.toBeInTheDocument()
  expect(
    within(cardElement).queryByRole('button', { name: 'Edit' }),
  ).not.toBeInTheDocument()
})
