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

import { useStoreDeletedComments } from '../model/use-store-deleted-comments'
import { useStoreEditedComments } from '../model/use-store-edited-comments'

if (!HTMLDialogElement.prototype.showModal)
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
if (!HTMLDialogElement.prototype.close)
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
  }

const seedResident = (role = 'resident') =>
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
  fake.seed('posts/post-1', {
    author: {
      apartment: 42,
      block: 1,
      name: 'Алиса',
      phone: '+7 700 000 00 00',
    },
    authorId: 'author-uid',
    category: 'sell',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1000),
    description: 'Описание объявления для проверки треда комментариев.',
    keywords: ['велосипед'],
    kind: 'offer',
    lang: 'ru',
    media: [],
    reactions: {},
    title: 'Продам горный велосипед',
    ...overrides,
  })

const seedIssue = (overrides: Record<string, unknown> = {}) =>
  fake.seed('issues/issue-1', {
    author: { apartment: 12, block: 1, name: 'Житель' },
    authorId: 'author-uid',
    category: 'other',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1000),
    description: 'Домофон у подъезда не открывает дверь по ключу',
    keywords: ['домофон'],
    lang: 'ru',
    media: [],
    number: 301,
    reactions: {},
    status: 'in-progress',
    tags: [],
    title: 'Не работает домофон',
    urgent: false,
    ...overrides,
  })

const seedMine = (path: string, text: string, createdAt = 1000) =>
  fake.seed(path, {
    author: { apartment: 42, block: 1, name: 'Алиса' },
    authorId: 'uid-1',
    createdAt: Timestamp.fromMillis(createdAt),
    lang: 'ru',
    media: [],
    text,
  })

const seedOther = (path: string, text: string, createdAt = 2000) =>
  fake.seed(path, {
    author: { apartment: 12, block: 1, name: 'Джеки Чан' },
    authorId: 'author-uid',
    createdAt: Timestamp.fromMillis(createdAt),
    lang: 'ru',
    media: [],
    text,
  })

const commentButton = () => screen.getByRole('button', { name: /Комментарии/ })

const commentField = () => screen.getByPlaceholderText('Наберите текст')

const messageRow = (text: string) => {
  const row = screen.getByText(text).parentElement?.parentElement?.parentElement
  if (!row) throw new Error(`row for "${text}" not found`)
  return row
}

const messageActions = (text: string) =>
  within(messageRow(text)).queryByTitle('Действия с сообщением')

const openActions = async (
  user: ReturnType<typeof renderAppWithServer>['user'],
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
  fake.reset()
  injectFake()
  useStoreDeletedComments.setState({ deletedIds: new Set() })
  useStoreEditedComments.setState({ edited: {} })
})

afterEach(resetFirestore)

test('happy-path 15: opening edit on your own message loads its text into the input bar', async () => {
  seedResident()
  seedPost({ commentCount: 1 })
  seedMine('posts/post-1/comments/c1', 'Исходный текст')
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByText('Исходный текст')

  const sheet = await openActions(user, 'Исходный текст')
  await user.click(within(sheet).getByRole('button', { name: 'Редактировать' }))

  expect(commentField()).toHaveValue('Исходный текст')
  expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument()
})

test('happy-path 15a: saving an edited comment updates the message in place', async () => {
  seedResident()
  seedPost({ commentCount: 1 })
  seedMine('posts/post-1/comments/c1', 'Исходный текст')
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByText('Исходный текст')

  const sheet = await openActions(user, 'Исходный текст')
  await user.click(within(sheet).getByRole('button', { name: 'Редактировать' }))
  await user.clear(commentField())
  await user.type(commentField(), 'Обновлённый текст')
  await user.click(screen.getByRole('button', { name: 'Сохранить' }))

  expect(await screen.findByText('Обновлённый текст')).toBeInTheDocument()
  expect(screen.queryByText('Исходный текст')).not.toBeInTheDocument()
  await waitFor(() =>
    expect(fake.getDoc('posts/post-1/comments/c1')?.text).toBe(
      'Обновлённый текст',
    ),
  )
})

test('happy-path 16: the author deletes their own comment and the count decreases by one', async () => {
  seedResident()
  seedPost({ commentCount: 1 })
  seedMine('posts/post-1/comments/c1', 'Удалить меня')
  const { currentPath, user } = renderAppWithServer('/posts?tab=all', {
    uid: 'uid-1',
  })
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
  expect(fake.getDoc('posts/post-1')?.commentCount).toBe(0)
  expect(fake.getDoc('posts/post-1/comments/c1')).toBeUndefined()
})

test('happy-path 17: Administration deletes another member’s comment regardless of authorship', async () => {
  seedResident('administration')
  seedPost({ commentCount: 1 })
  seedOther('posts/post-1/comments/c1', 'Чужое сообщение')
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
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
  expect(fake.getDoc('posts/post-1/comments/c1')).toBeUndefined()
})

test('validation 15: canceling the delete confirmation leaves the comment in the thread', async () => {
  seedResident()
  seedPost({ commentCount: 1 })
  seedMine('posts/post-1/comments/c1', 'Не удаляй меня')
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
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
  expect(fake.getDoc('posts/post-1/comments/c1')).toBeDefined()
})

test('edge-cases 17: a member sees actions only on their own comment', async () => {
  seedResident('resident')
  seedPost({ commentCount: 2 })
  seedMine('posts/post-1/comments/own', 'Моё сообщение', 1000)
  seedOther('posts/post-1/comments/other', 'Чужое сообщение', 2000)
  renderAppWithServer('/posts/post-1/comments', { uid: 'uid-1' })
  await screen.findByText('Моё сообщение')

  expect(messageActions('Моё сообщение')).not.toBeNull()
  expect(messageActions('Чужое сообщение')).toBeNull()
})

test('edge-cases 17: Administration sees the delete action on every comment', async () => {
  seedResident('administration')
  seedPost({ commentCount: 1 })
  seedOther('posts/post-1/comments/other', 'Чужое сообщение')
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByText('Чужое сообщение')

  const sheet = await openActions(user, 'Чужое сообщение')
  expect(
    within(sheet).getByRole('button', { name: 'Удалить сообщение' }),
  ).toBeInTheDocument()
})

test('error-states 7 / error-states 9: a failed edit surfaces an error and keeps the edited text in edit mode', async () => {
  seedResident()
  seedPost({ commentCount: 1 })
  seedMine('posts/post-1/comments/c1', 'Исходный текст')
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
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
  seedResident()
  seedPost({ commentCount: 1 })
  seedMine('posts/post-1/comments/c1', 'Останься на месте')
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
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
  expect(fake.getDoc('posts/post-1/comments/c1')).toBeDefined()
})

test('edge-cases 7: deleting a comment on an issue decrements the issue’s comment count identically to a post', async () => {
  seedResident()
  seedIssue({ commentCount: 1 })
  seedMine('issues/issue-1/comments/i1', 'Удалить меня')
  const { currentPath, user } = renderAppWithServer('/issues?status=all', {
    uid: 'uid-1',
  })
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
  expect(fake.getDoc('issues/issue-1')?.commentCount).toBe(0)
})
