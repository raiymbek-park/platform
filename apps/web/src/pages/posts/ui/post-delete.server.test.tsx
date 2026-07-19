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
    name: 'Алиса',
    phone: '+77781234455',
    role,
  })

const seedPost = (overrides: Record<string, unknown> = {}) =>
  fake.seed('posts/post-201', {
    author: {
      apartment: 12,
      block: 3,
      name: 'Алиса',
      phone: '+7 700 000 00 00',
    },
    authorId: 'uid-1',
    category: 'sell',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1000),
    description: 'Продаю велосипед в отличном состоянии',
    keywords: ['велосипед'],
    kind: 'offer',
    lang: 'ru',
    media: [],
    reactions: {},
    title: 'Продам горный велосипед',
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
) => user.click(within(cardElement).getByRole('button', { name: /Подробнее/ }))

const openDeleteConfirm = async (
  user: ReturnType<typeof renderAppWithServer>['user'],
) => {
  const cardElement = await card()
  await expandCard(user, cardElement)
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
})

afterEach(resetFirestore)

test('happy-path 11: the author confirms delete — the real backend removes the post from the datastore and the feed', async () => {
  seedResident()
  seedPost()
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Продам горный велосипед')

  const confirmButton = await openDeleteConfirm(user)
  await user.click(confirmButton)

  expect(await screen.findByText('Объявление удалено.')).toBeInTheDocument()
  await waitFor(() =>
    expect(
      screen.queryByText('Продам горный велосипед'),
    ).not.toBeInTheDocument(),
  )
  expect(fake.getDoc('posts/post-201')).toBeUndefined()
})

test('validation 12: canceling the delete confirmation leaves the post stored and in the feed', async () => {
  seedResident()
  seedPost()
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Продам горный велосипед')

  const cardElement = await card()
  await expandCard(user, cardElement)
  await user.click(within(cardElement).getByRole('button', { name: 'Удалить' }))
  const dialog = await screen.findByRole('dialog')
  await user.click(within(dialog).getByRole('button', { name: 'Отмена' }))

  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  )
  expect(screen.getByText('Продам горный велосипед')).toBeInTheDocument()
  expect(fake.getDoc('posts/post-201')).toBeDefined()
})

test('error-states 4: a failed delete shows an error toast and keeps the post stored and in the feed', async () => {
  seedResident()
  seedPost()
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Продам горный велосипед')

  const confirmButton = await openDeleteConfirm(user)
  trpcServer.use(trpcMutationError('posts.delete'))
  await user.click(confirmButton)

  expect(
    await screen.findByText(
      'Не удалось удалить объявление. Попробуйте ещё раз.',
    ),
  ).toBeInTheDocument()
  expect(screen.getByText('Продам горный велосипед')).toBeInTheDocument()
  expect(fake.getDoc('posts/post-201')).toBeDefined()
})

test('happy-path 12: an Administration user deletes a post authored by someone else', async () => {
  seedResident('administration')
  seedPost({ authorId: 'author-uid' })
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Продам горный велосипед')

  const confirmButton = await openDeleteConfirm(user)
  await user.click(confirmButton)

  expect(await screen.findByText('Объявление удалено.')).toBeInTheDocument()
  expect(fake.getDoc('posts/post-201')).toBeUndefined()
})

test('happy-path 12: an Administration user can reach edit for a post authored by someone else', async () => {
  seedResident('administration')
  seedPost({ authorId: 'author-uid' })
  const { currentPath, user } = renderAppWithServer('/posts?tab=all', {
    uid: 'uid-1',
  })
  await screen.findByText('Продам горный велосипед')

  const cardElement = await card()
  await expandCard(user, cardElement)
  await user.click(
    within(cardElement).getByRole('button', { name: 'Редактировать' }),
  )

  expect(currentPath()).toBe('/posts/edit/post-201')
})

test('edge-cases 6: a Resident sees no edit or delete action on a post authored by someone else', async () => {
  seedResident('resident')
  seedPost({ authorId: 'author-uid' })
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Продам горный велосипед')

  const cardElement = await card()
  await expandCard(user, cardElement)

  expect(
    within(cardElement).queryByRole('button', { name: 'Удалить' }),
  ).not.toBeInTheDocument()
  expect(
    within(cardElement).queryByRole('button', { name: 'Редактировать' }),
  ).not.toBeInTheDocument()
})
