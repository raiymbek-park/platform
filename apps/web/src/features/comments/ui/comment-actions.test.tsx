import type { Comment } from '@raiymbek-park/api'
import type { PermissionRole } from '@raiymbek-park/shared/validation-schemas'

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

const seedComment = (overrides: Partial<Comment> = {}): Comment => ({
  author: { apartment: 12, block: 1, name: 'Тимур Ким' },
  createdAt: 1_700_000_000_000,
  editedAt: null,
  id: 'comment-1',
  isMine: false,
  media: [],
  text: 'Отличное предложение',
  ...overrides,
})

const post = () => ({
  author: {
    apartment: 42,
    block: 1,
    name: 'Алиса',
    phone: '+7 700 000 00 00',
  },
  category: 'sell' as const,
  commentCount: postComments.length,
  createdAt: 1000,
  description: 'Описание объявления для проверки треда комментариев.',
  dislikeCount: 0,
  id: 'post-1',
  isMine: false,
  isPinned: false,
  keywords: [],
  kind: 'offer' as const,
  likeCount: 0,
  media: [],
  myReaction: null,
  title: 'Продам горный велосипед',
})

const issue = () => ({
  author: { apartment: 12, block: 1, name: 'Житель' },
  category: 'other' as const,
  commentCount: issueComments.length,
  createdAt: 1_700_000_000_000,
  description: 'Домофон у подъезда не открывает дверь по ключу',
  dislikeCount: 0,
  id: 'issue-1',
  isMine: false,
  keywords: [],
  likeCount: 0,
  media: [],
  myReaction: null,
  number: 301,
  status: 'in-progress' as const,
  tags: [],
  title: 'Не работает домофон',
  urgent: false,
})

let postComments: Comment[] = []
let issueComments: Comment[] = []

const serve = (role: PermissionRole = 'resident') =>
  trpcServer.use(
    trpcQueries({
      'comments.list': (raw: unknown) => {
        const { parent } = raw as { parent: 'post' | 'issue' }
        return {
          comments: parent === 'post' ? postComments : issueComments,
          nextCursor: null,
        }
      },
      'issues.get': () => issue(),
      'issues.list': () => ({ issues: [issue()], nextCursor: null }),
      'posts.get': () => post(),
      'posts.list': () => ({ nextCursor: null, posts: [post()] }),
      'resident.me': () => ({ apartment: 42, block: 1, name: 'Алиса', role }),
    }),
    trpcMutation('comments.update', raw => {
      const { id, media, text } = raw as {
        id: string
        media: string[]
        text: string
      }
      postComments = postComments.map(comment =>
        comment.id === id
          ? { ...comment, editedAt: Date.now(), media, text }
          : comment,
      )
      return { ok: true }
    }),
    trpcMutation('comments.delete', raw => {
      const { id, parent } = raw as { id: string; parent: 'post' | 'issue' }
      if (parent === 'post')
        postComments = postComments.filter(comment => comment.id !== id)
      else issueComments = issueComments.filter(comment => comment.id !== id)
      return { ok: true }
    }),
  )

const commentButton = () => screen.getByRole('button', { name: /Комментарии/ })

const commentField = () => screen.getByPlaceholderText('Наберите текст')

const messageRow = (text: string) => {
  const row = screen.getByText(text).parentElement?.parentElement?.parentElement
  if (!row) throw new Error(`row for "${text}" not found`)
  return row
}

const messageActions = (text: string) =>
  within(messageRow(text)).queryByRole('button', {
    name: 'Действия с сообщением',
  })

const openActions = async (
  user: ReturnType<typeof renderApp>['user'],
  text: string,
) => {
  const trigger = messageActions(text)
  if (!trigger) throw new Error(`message "${text}" is not actionable`)
  await user.click(trigger)
  return screen.findByRole('dialog')
}

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  postComments = []
  issueComments = []
})

test('happy-path 15: opening edit on your own message loads its text into the input bar', async () => {
  postComments = [
    seedComment({
      author: { apartment: 42, block: 1, name: 'Алиса' },
      id: 'c1',
      isMine: true,
      text: 'Исходный текст',
    }),
  ]
  serve()
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByText('Исходный текст')

  const sheet = await openActions(user, 'Исходный текст')
  await user.click(within(sheet).getByRole('button', { name: 'Редактировать' }))

  expect(commentField()).toHaveValue('Исходный текст')
  expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument()
})

test('happy-path 15a: saving an edited comment updates the message in place', async () => {
  postComments = [
    seedComment({
      author: { apartment: 42, block: 1, name: 'Алиса' },
      id: 'c1',
      isMine: true,
      text: 'Исходный текст',
    }),
  ]
  serve()
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByText('Исходный текст')

  const sheet = await openActions(user, 'Исходный текст')
  await user.click(within(sheet).getByRole('button', { name: 'Редактировать' }))
  await user.clear(commentField())
  await user.type(commentField(), 'Обновлённый текст')
  await user.click(screen.getByRole('button', { name: 'Сохранить' }))

  expect(await screen.findByText('Обновлённый текст')).toBeInTheDocument()
  expect(screen.queryByText('Исходный текст')).not.toBeInTheDocument()
})

test('happy-path 16: the author deletes their own comment and the count decreases by one', async () => {
  postComments = [
    seedComment({
      author: { apartment: 42, block: 1, name: 'Алиса' },
      id: 'c1',
      isMine: true,
      text: 'Удалить меня',
    }),
  ]
  serve()
  const { currentPath, user } = renderApp('/posts?tab=all')
  await screen.findByText('Продам горный велосипед')
  expect(within(commentButton()).getByText('1')).toBeInTheDocument()

  await user.click(commentButton())
  await screen.findByText('Удалить меня')

  const sheet = await openActions(user, 'Удалить меня')
  await user.click(
    within(sheet).getByRole('button', { name: 'Удалить сообщение' }),
  )
  const confirmDialog = await screen.findByRole('dialog')
  await user.click(
    within(confirmDialog).getByRole('button', { name: 'Удалить' }),
  )

  expect(await screen.findByText('Сообщение удалено.')).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.queryByText('Удалить меня')).not.toBeInTheDocument(),
  )

  await user.click(screen.getByRole('button', { name: 'Назад' }))
  await waitFor(() => expect(currentPath()).toBe('/posts'))
  await waitFor(() =>
    expect(within(commentButton()).getByText('0')).toBeInTheDocument(),
  )
})

test('happy-path 17: Administration deletes another member’s comment regardless of authorship', async () => {
  postComments = [
    seedComment({ id: 'c1', isMine: false, text: 'Чужое сообщение' }),
  ]
  serve('administration')
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByText('Чужое сообщение')

  const sheet = await openActions(user, 'Чужое сообщение')
  expect(
    within(sheet).queryByRole('button', { name: 'Редактировать' }),
  ).not.toBeInTheDocument()
  await user.click(
    within(sheet).getByRole('button', { name: 'Удалить сообщение' }),
  )
  const confirmDialog = await screen.findByRole('dialog')
  await user.click(
    within(confirmDialog).getByRole('button', { name: 'Удалить' }),
  )

  expect(await screen.findByText('Сообщение удалено.')).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.queryByText('Чужое сообщение')).not.toBeInTheDocument(),
  )
})

test('validation 15: canceling the delete confirmation leaves the comment in the thread', async () => {
  postComments = [
    seedComment({
      author: { apartment: 42, block: 1, name: 'Алиса' },
      id: 'c1',
      isMine: true,
      text: 'Не удаляй меня',
    }),
  ]
  serve()
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByText('Не удаляй меня')

  const sheet = await openActions(user, 'Не удаляй меня')
  await user.click(
    within(sheet).getByRole('button', { name: 'Удалить сообщение' }),
  )
  const dialog = await screen.findByRole('dialog')
  await user.click(within(dialog).getByRole('button', { name: 'Отмена' }))

  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  )
  expect(screen.getByText('Не удаляй меня')).toBeInTheDocument()
})

test('edge-cases 17: a member sees actions only on their own comment', async () => {
  postComments = [
    seedComment({
      author: { apartment: 42, block: 1, name: 'Алиса' },
      id: 'own',
      isMine: true,
      text: 'Моё сообщение',
    }),
    seedComment({ id: 'other', isMine: false, text: 'Чужое сообщение' }),
  ]
  serve('resident')
  renderApp('/posts/post-1/comments')
  await screen.findByText('Моё сообщение')

  expect(messageActions('Моё сообщение')).not.toBeNull()
  expect(messageActions('Чужое сообщение')).toBeNull()
})

test('edge-cases 17: Administration sees the delete action on every comment', async () => {
  postComments = [
    seedComment({ id: 'other', isMine: false, text: 'Чужое сообщение' }),
  ]
  serve('administration')
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByText('Чужое сообщение')

  const sheet = await openActions(user, 'Чужое сообщение')
  expect(
    within(sheet).getByRole('button', { name: 'Удалить сообщение' }),
  ).toBeInTheDocument()
})

test('error-states 7 / error-states 9: a failed edit surfaces an error and keeps the edited text in edit mode', async () => {
  postComments = [
    seedComment({
      author: { apartment: 42, block: 1, name: 'Алиса' },
      id: 'c1',
      isMine: true,
      text: 'Исходный текст',
    }),
  ]
  serve()
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByText('Исходный текст')

  const sheet = await openActions(user, 'Исходный текст')
  await user.click(within(sheet).getByRole('button', { name: 'Редактировать' }))
  await user.clear(commentField())
  await user.type(commentField(), 'Изменённый текст')
  trpcServer.use(trpcMutationError('comments.update'))
  await user.click(screen.getByRole('button', { name: 'Сохранить' }))

  expect(
    await screen.findByText(
      'Не удалось сохранить изменения. Попробуйте ещё раз.',
    ),
  ).toBeInTheDocument()
  expect(commentField()).toHaveValue('Изменённый текст')
  expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument()
})

test('error-states 7 / error-states 9: a failed delete leaves the message visible in the thread', async () => {
  postComments = [
    seedComment({
      author: { apartment: 42, block: 1, name: 'Алиса' },
      id: 'c1',
      isMine: true,
      text: 'Останься на месте',
    }),
  ]
  serve()
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByText('Останься на месте')

  const sheet = await openActions(user, 'Останься на месте')
  await user.click(
    within(sheet).getByRole('button', { name: 'Удалить сообщение' }),
  )
  const confirmDialog = await screen.findByRole('dialog')
  trpcServer.use(trpcMutationError('comments.delete'))
  await user.click(
    within(confirmDialog).getByRole('button', { name: 'Удалить' }),
  )

  expect(
    await screen.findByText(
      'Не удалось удалить сообщение. Попробуйте ещё раз.',
    ),
  ).toBeInTheDocument()
  expect(screen.getByText('Останься на месте')).toBeInTheDocument()
})

test('edge-cases 7: deleting a comment on an issue decrements the issue’s comment count identically to a post', async () => {
  issueComments = [
    seedComment({
      author: { apartment: 42, block: 1, name: 'Алиса' },
      id: 'i1',
      isMine: true,
      text: 'Удалить меня',
    }),
  ]
  serve()
  const { currentPath, user } = renderApp('/issues?status=all')
  await screen.findByText('Не работает домофон')
  const issueCommentButton = () =>
    screen.getByRole('button', { name: /Комментарии/ })
  expect(within(issueCommentButton()).getByText('1')).toBeInTheDocument()

  await user.click(issueCommentButton())
  await screen.findByText('Удалить меня')

  const sheet = await openActions(user, 'Удалить меня')
  await user.click(
    within(sheet).getByRole('button', { name: 'Удалить сообщение' }),
  )
  const confirmDialog = await screen.findByRole('dialog')
  await user.click(
    within(confirmDialog).getByRole('button', { name: 'Удалить' }),
  )

  expect(await screen.findByText('Сообщение удалено.')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Назад' }))
  await waitFor(() => expect(currentPath()).toBe('/issues'))
  await waitFor(() =>
    expect(within(issueCommentButton()).getByText('0')).toBeInTheDocument(),
  )
})
