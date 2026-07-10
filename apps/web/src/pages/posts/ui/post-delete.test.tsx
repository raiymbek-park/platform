import type { Post } from '@raiymbek-park/api'
import type { PermissionRole } from '@raiymbek-park/shared/validation-schemas'

import { postRefInputSchema } from '@raiymbek-park/shared/validation-schemas'
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
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
if (!HTMLDialogElement.prototype.close)
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
  }

const seedPost: Post = {
  author: {
    apartment: 12,
    block: 3,
    name: 'Алиса',
    phone: '+7 700 000 00 00',
  },
  category: 'sell',
  commentCount: 0,
  createdAt: 1000,
  description: 'Продаю велосипед в отличном состоянии',
  dislikeCount: 0,
  id: 'post-201',
  isMine: true,
  isPinned: false,
  isTranslated: false,
  keywords: ['велосипед'],
  kind: 'offer',
  likeCount: 0,
  media: [],
  myReaction: null,
  original: null,
  originalLang: 'ru',
  title: 'Продам горный велосипед',
}

let posts: Post[] = [seedPost]

const serve = (role: PermissionRole = 'resident') =>
  trpcServer.use(
    trpcQueries({
      'posts.list': () => ({ nextCursor: null, posts }),
      'resident.me': () => ({ apartment: 42, block: 1, name: 'Алиса', role }),
    }),
    trpcMutation('posts.delete', raw => {
      const { postId } = postRefInputSchema.parse(raw)
      posts = posts.filter(post => post.id !== postId)
      return { ok: true }
    }),
  )

const card = async () => {
  const [element] = await screen.findAllByRole('article')
  if (!element) throw new Error('no card rendered')
  return element
}

const expandCard = async (
  user: ReturnType<typeof renderApp>['user'],
  cardElement: HTMLElement,
) => user.click(within(cardElement).getByRole('button', { name: /Подробнее/ }))

const openDeleteConfirm = async (
  user: ReturnType<typeof renderApp>['user'],
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
  posts = [{ ...seedPost }]
})

test('happy-path 11: the author deletes their own post and it is removed from the feed', async () => {
  serve()
  const { user } = renderApp('/posts?tab=all')
  await screen.findByText('Продам горный велосипед')

  const confirmButton = await openDeleteConfirm(user)
  await user.click(confirmButton)

  expect(await screen.findByText('Объявление удалено.')).toBeInTheDocument()
  await waitFor(() =>
    expect(
      screen.queryByText('Продам горный велосипед'),
    ).not.toBeInTheDocument(),
  )
})

test('validation 12: canceling the delete confirmation leaves the post in the feed', async () => {
  serve()
  const { user } = renderApp('/posts?tab=all')
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
})

test('error-states 4: a failed delete shows an error toast and keeps the post in the feed', async () => {
  serve()
  const { user } = renderApp('/posts?tab=all')
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
})

test('happy-path 12: Administration deletes a post authored by someone else', async () => {
  posts = [{ ...seedPost, isMine: false }]
  serve('administration')
  const { user } = renderApp('/posts?tab=all')
  await screen.findByText('Продам горный велосипед')

  const confirmButton = await openDeleteConfirm(user)
  await user.click(confirmButton)

  expect(await screen.findByText('Объявление удалено.')).toBeInTheDocument()
})

test('happy-path 12: Administration can reach edit for a post authored by someone else', async () => {
  posts = [{ ...seedPost, isMine: false }]
  serve('administration')
  const { currentPath, user } = renderApp('/posts?tab=all')
  await screen.findByText('Продам горный велосипед')

  const cardElement = await card()
  await expandCard(user, cardElement)
  await user.click(
    within(cardElement).getByRole('button', { name: 'Редактировать' }),
  )

  expect(currentPath()).toBe('/posts/edit/post-201')
})

test('edge-cases 6: a Resident sees no edit or delete action on a post authored by someone else', async () => {
  posts = [{ ...seedPost, isMine: false }]
  serve('resident')
  const { user } = renderApp('/posts?tab=all')
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
