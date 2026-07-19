import {
  fake,
  injectFake,
  resetFirestore,
  Timestamp,
} from '@raiymbek-park/api/testing'
import { screen, waitFor, within } from '@testing-library/react'
import { delay, HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { env } from '@/shared/config'
import { firebaseAuth, trpcMutationError, trpcServer } from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

import { useStoreDeletedComments } from '../model/use-store-deleted-comments'
import { useStoreEditedComments } from '../model/use-store-edited-comments'

if (!URL.createObjectURL)
  Object.assign(URL, {
    createObjectURL: () => 'blob:x',
    revokeObjectURL: () => {},
  })

const makeFile = (
  name: string,
  { size, type = 'image/jpeg' }: { size?: number; type?: string } = {},
) => {
  const file = new File([], name, { type })
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size })
  return file
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

const seedComment = (path: string, overrides: Record<string, unknown> = {}) =>
  fake.seed(path, {
    author: { apartment: 12, block: 1, name: 'Джеки Чан' },
    authorId: 'author-uid',
    createdAt: Timestamp.fromMillis(1000),
    lang: 'ru',
    media: [],
    text: 'Отличное предложение',
    ...overrides,
  })

const mineComment = (
  path: string,
  text: string,
  createdAt = 2000,
): [string, Record<string, unknown>] => [
  path,
  {
    author: { apartment: 42, block: 1, name: 'Алиса' },
    authorId: 'uid-1',
    createdAt: Timestamp.fromMillis(createdAt),
    text,
  },
]

const breakCommentsList = () =>
  trpcServer.use(
    http.get(`${env.apiUrl}/*`, ({ request }) => {
      const url = new URL(request.url)
      if (!url.pathname.includes('comments.list')) return undefined
      const procedures = (url.pathname.split('/').at(-1) ?? '').split(',')
      return HttpResponse.json(
        procedures.map(() => ({
          error: {
            code: -32603,
            data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 },
            message: 'INTERNAL_SERVER_ERROR',
          },
        })),
        { status: 500 },
      )
    }),
  )

const commentButton = () => screen.getByRole('button', { name: /Комментарии/ })

const commentField = () => screen.getByPlaceholderText('Наберите текст')

const sendButton = () => screen.getByRole('button', { name: 'Отправить' })

const fileInput = () => {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('file input not found')
  return input
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

test('happy-path 13: opening a post’s comment thread shows the post’s title, own and other messages with avatar, name, time, and media', async () => {
  seedResident()
  seedPost({ commentCount: 2 })
  seedComment('posts/post-1/comments/c1', {
    media: ['https://cdn.test/photo.jpg'],
    text: 'Отличное предложение',
  })
  seedComment(...mineComment('posts/post-1/comments/c2', 'Спасибо!'))
  const { currentPath, user } = renderAppWithServer('/posts?tab=all', {
    uid: 'uid-1',
  })
  await screen.findByText('Продам горный велосипед')

  await user.click(commentButton())

  expect(currentPath()).toBe('/posts/post-1/comments')
  expect(await screen.findByText('Продам горный велосипед')).toBeInTheDocument()
  expect(await screen.findByText('Отличное предложение')).toBeInTheDocument()
  expect(screen.getByText('Спасибо!')).toBeInTheDocument()
  expect(screen.getByText('ДЧ')).toBeInTheDocument()
  expect(document.querySelectorAll('img').length).toBeGreaterThan(0)
})

test('edge-cases 7: the same thread reused on an issue shows its title and messages identically', async () => {
  seedResident()
  seedIssue({ commentCount: 1 })
  seedComment('issues/issue-1/comments/i1', { text: 'Когда почините домофон?' })
  renderAppWithServer('/issues/issue-1/comments', { uid: 'uid-1' })

  expect(await screen.findByText('Не работает домофон')).toBeInTheDocument()
  expect(await screen.findByText('Когда почините домофон?')).toBeInTheDocument()
  expect(commentField()).toBeInTheDocument()
})

test('edge-cases 7: writing a comment on an issue appends it and increments the issue’s comment count identically to a post', async () => {
  seedResident()
  seedIssue({ commentCount: 0 })
  const { currentPath, user } = renderAppWithServer('/issues?status=all', {
    uid: 'uid-1',
  })
  await screen.findByText('Не работает домофон')
  const issueCommentButton = () =>
    screen.getByRole('button', { name: /Комментарии/ })
  expect(within(issueCommentButton()).getByText('0')).toBeInTheDocument()

  await user.click(issueCommentButton())
  expect(currentPath()).toBe('/issues/issue-1/comments')

  await user.type(commentField(), 'Когда планируете чинить?')
  await user.click(sendButton())
  expect(
    await screen.findByText('Когда планируете чинить?'),
  ).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Назад' }))
  await waitFor(() => expect(currentPath()).toBe('/issues'))
  await waitFor(() =>
    expect(within(issueCommentButton()).getByText('1')).toBeInTheDocument(),
  )
  expect(fake.getDoc('issues/issue-1')?.commentCount).toBe(1)
  expect(fake.listDocs('issues/issue-1/comments')).toHaveLength(1)
})

test('validation: a Viewer sees no way to write a comment', async () => {
  seedResident('viewer')
  seedPost({ commentCount: 1 })
  seedComment('posts/post-1/comments/c1', { text: 'Отличное предложение' })
  renderAppWithServer('/posts/post-1/comments', { uid: 'uid-1' })
  await screen.findByText('Отличное предложение')

  expect(
    screen.queryByPlaceholderText('Наберите текст'),
  ).not.toBeInTheDocument()
})

test('happy-path 14: writing a comment with text and an image appends it to the thread and increments the post’s comment count', async () => {
  seedResident()
  seedPost({ commentCount: 0 })
  const { currentPath, user } = renderAppWithServer('/posts?tab=all', {
    uid: 'uid-1',
  })
  await screen.findByText('Продам горный велосипед')
  expect(within(commentButton()).getByText('0')).toBeInTheDocument()

  await user.click(commentButton())
  expect(currentPath()).toBe('/posts/post-1/comments')

  await user.upload(fileInput(), makeFile('photo.jpg'))
  await user.type(commentField(), 'Здравствуйте, ещё актуально?')
  await user.click(sendButton())

  expect(
    await screen.findByText('Здравствуйте, ещё актуально?'),
  ).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Назад' }))
  await waitFor(() => expect(currentPath()).toBe('/posts'))
  await waitFor(() =>
    expect(within(commentButton()).getByText('1')).toBeInTheDocument(),
  )
  expect(fake.getDoc('posts/post-1')?.commentCount).toBe(1)
})

test('validation 5: sending is blocked with empty text and no media', async () => {
  seedResident()
  seedPost()
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByPlaceholderText('Наберите текст')

  expect(sendButton()).toBeDisabled()

  await user.type(commentField(), '   ')
  expect(sendButton()).toBeDisabled()
})

test('validation 5a / edge-cases 15: comment text beyond 1000 characters is capped, and exactly 1000 characters is accepted', async () => {
  seedResident()
  seedPost()
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByPlaceholderText('Наберите текст')

  await user.click(commentField())
  await user.paste('а'.repeat(1005))

  expect(commentField()).toHaveValue('а'.repeat(1000))
  expect(sendButton()).toBeEnabled()
})

test('validation 6a: a comment with raw HTML and a script tag renders only the safe Markdown subset', async () => {
  seedResident()
  seedPost({ commentCount: 1 })
  seedComment('posts/post-1/comments/c1', {
    text: '**Важно** <script>window.__xss = true</script>',
  })
  renderAppWithServer('/posts/post-1/comments', { uid: 'uid-1' })

  const emphasis = await screen.findByText('Важно')
  expect(emphasis.tagName).toBe('STRONG')
  expect(document.querySelector('script')).toBeNull()
  expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined()
})

test('validation 13: attaching more than 10 files to a comment is rejected', async () => {
  seedResident()
  seedPost()
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByPlaceholderText('Наберите текст')

  const files = Array.from({ length: 11 }, (_, index) =>
    makeFile(`photo-${index}.jpg`),
  )
  await user.upload(fileInput(), files)

  expect(
    await screen.findByText('Можно прикрепить не более 10 файлов'),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Удалить' }),
  ).not.toBeInTheDocument()
})

test('edge-cases 16: attaching exactly 10 media items whose combined size is exactly 200 MB is accepted for a comment', async () => {
  seedResident()
  seedPost()
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByPlaceholderText('Наберите текст')

  const files = Array.from({ length: 10 }, (_, index) =>
    makeFile(`photo-${index}.jpg`, {
      size: index === 0 ? 200 * 1024 * 1024 : 0,
    }),
  )
  await user.upload(fileInput(), files)

  expect(
    await screen.findAllByRole('button', { name: 'Удалить' }),
  ).toHaveLength(10)
  expect(
    screen.queryByText('Можно прикрепить не более 10 файлов'),
  ).not.toBeInTheDocument()
  expect(sendButton()).toBeEnabled()
})

test('validation 14: the send action disables while the comment mutation is pending, and a second tap does not send a duplicate request', async () => {
  seedResident()
  seedPost()
  let createCalls = 0
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByPlaceholderText('Наберите текст')
  trpcServer.use(
    http.post(`${env.apiUrl}/comments.create`, async () => {
      createCalls += 1
      await delay('infinite')
      return HttpResponse.json([{ result: { data: { ok: true } } }])
    }),
  )

  await user.type(commentField(), 'Привет')
  await user.click(sendButton())

  await waitFor(() => expect(sendButton()).toBeDisabled())
  await user.click(sendButton())

  expect(createCalls).toBe(1)
})

test('error-states 6: a failed thread query shows an error while the input bar and back navigation stay usable', async () => {
  seedResident()
  seedPost()
  const { currentPath, user } = renderAppWithServer('/posts?tab=all', {
    uid: 'uid-1',
  })
  await screen.findByText('Продам горный велосипед')
  breakCommentsList()

  await user.click(commentButton())

  expect(
    await screen.findByTestId('comment-error', undefined, { timeout: 4000 }),
  ).toBeInTheDocument()
  await user.type(commentField(), 'Ещё работает')
  expect(commentField()).toHaveValue('Ещё работает')

  await user.click(screen.getByRole('button', { name: 'Назад' }))
  await waitFor(() => expect(currentPath()).toBe('/posts'))
})

test('error-states 7 / error-states 9: a failed send surfaces an error, preserves the entered text and photo, and leaves the comment count unchanged', async () => {
  seedResident()
  seedPost({ commentCount: 0 })
  const { currentPath, user } = renderAppWithServer('/posts?tab=all', {
    uid: 'uid-1',
  })
  await screen.findByText('Продам горный велосипед')
  await user.click(commentButton())
  await screen.findByPlaceholderText('Наберите текст')
  trpcServer.use(trpcMutationError('comments.create'))

  await user.upload(fileInput(), makeFile('photo.jpg'))
  await user.type(commentField(), 'Ещё актуально?')
  await user.click(sendButton())

  expect(
    await screen.findByText(
      'Не удалось отправить сообщение. Попробуйте ещё раз.',
    ),
  ).toBeInTheDocument()
  expect(commentField()).toHaveValue('Ещё актуально?')
  expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Назад' }))
  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(within(commentButton()).getByText('0')).toBeInTheDocument()
  expect(fake.getDoc('posts/post-1')?.commentCount).toBe(0)
})
