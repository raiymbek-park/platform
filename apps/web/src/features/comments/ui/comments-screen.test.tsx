import type { Comment } from '@raiymbek-park/api'
import type {
  CommentParent,
  PermissionRole,
} from '@raiymbek-park/shared/validation-schemas'

import { commentCreateInputSchema } from '@raiymbek-park/shared/validation-schemas'
import { screen, waitFor, within } from '@testing-library/react'
import { delay, HttpResponse, http } from 'msw'
import { beforeEach, expect, test } from 'vitest'

import { env } from '@/shared/config'
import {
  firebaseAuth,
  firebaseStorage,
  renderApp,
  trpcMutation,
  trpcMutationError,
  trpcQueries,
  trpcServer,
} from '@/shared/test'

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

const seedComment = (overrides: Partial<Comment> = {}): Comment => ({
  author: { apartment: 12, avatarUrl: null, block: 1, name: 'Тимур Ким' },
  createdAt: 1_700_000_000_000,
  editedAt: null,
  id: 'comment-1',
  isMine: false,
  isTranslated: false,
  lang: 'ru',
  media: [],
  original: null,
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
  commentCount: postCommentCount,
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
  commentCount: issueCommentCount,
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
let postCommentCount = 0
let issueCommentCount = 0

const serve = (role: PermissionRole = 'resident') =>
  trpcServer.use(
    trpcQueries({
      'comments.list': (raw: unknown) => {
        const { parent } = raw as { parent: CommentParent }
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
    trpcMutation('comments.create', raw => {
      const input = commentCreateInputSchema.parse(raw)
      const created = seedComment({
        author: { apartment: 42, avatarUrl: null, block: 1, name: 'Алиса' },
        createdAt: Date.now(),
        id: input.id,
        isMine: true,
        media: input.media,
        text: input.text,
      })
      if (input.parent === 'post') {
        postComments = [...postComments, created]
        postCommentCount += 1
      } else {
        issueComments = [...issueComments, created]
        issueCommentCount += 1
      }
      return { ok: true }
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
  firebaseStorage.reset()
  postComments = []
  issueComments = []
  postCommentCount = 0
  issueCommentCount = 0
})

test('happy-path 13: opening a post’s comment thread shows the post’s title, own and other messages with avatar, name, time, and media', async () => {
  postComments = [
    seedComment({
      id: 'c1',
      media: ['https://cdn.test/photo.jpg'],
      text: 'Отличное предложение',
    }),
    seedComment({
      author: { apartment: 42, avatarUrl: null, block: 1, name: 'Алиса' },
      id: 'c2',
      isMine: true,
      text: 'Спасибо!',
    }),
  ]
  serve()
  const { currentPath, user } = renderApp('/posts?tab=all')
  await screen.findByText('Продам горный велосипед')

  await user.click(commentButton())

  expect(currentPath()).toBe('/posts/post-1/comments')
  expect(await screen.findByText('Продам горный велосипед')).toBeInTheDocument()
  expect(await screen.findByText('Отличное предложение')).toBeInTheDocument()
  expect(screen.getByText('Спасибо!')).toBeInTheDocument()
  expect(screen.getByText('ТК')).toBeInTheDocument()
  expect(document.querySelectorAll('img').length).toBeGreaterThan(0)
})

test('edge-cases 7: the same thread reused on an issue shows its title and messages identically', async () => {
  issueComments = [seedComment({ id: 'i1', text: 'Когда почините домофон?' })]
  serve()
  renderApp('/issues/issue-1/comments')

  expect(await screen.findByText('Не работает домофон')).toBeInTheDocument()
  expect(await screen.findByText('Когда почините домофон?')).toBeInTheDocument()
  expect(commentField()).toBeInTheDocument()
})

test('edge-cases 7: writing a comment on an issue appends it and increments the issue’s comment count identically to a post', async () => {
  serve()
  const { currentPath, user } = renderApp('/issues?status=all')
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
})

test('validation: a Viewer sees no way to write a comment', async () => {
  postComments = [seedComment({ id: 'c1', text: 'Отличное предложение' })]
  serve('viewer')
  renderApp('/posts/post-1/comments')
  await screen.findByText('Отличное предложение')

  expect(
    screen.queryByPlaceholderText('Наберите текст'),
  ).not.toBeInTheDocument()
})

test('happy-path 14: writing a comment with text and an image appends it to the thread and increments the post’s comment count', async () => {
  serve()
  const { currentPath, user } = renderApp('/posts?tab=all')
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
})

test('validation 5: sending is blocked with empty text and no media', async () => {
  serve()
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByPlaceholderText('Наберите текст')

  expect(sendButton()).toBeDisabled()

  await user.type(commentField(), '   ')
  expect(sendButton()).toBeDisabled()
})

test('validation 5a / edge-cases 15: comment text beyond 1000 characters is capped, and exactly 1000 characters is accepted', async () => {
  serve()
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByPlaceholderText('Наберите текст')

  await user.click(commentField())
  await user.paste('а'.repeat(1005))

  expect(commentField()).toHaveValue('а'.repeat(1000))
  expect(sendButton()).toBeEnabled()
})

test('validation 6a: a comment with raw HTML and a script tag renders only the safe Markdown subset', async () => {
  postComments = [
    seedComment({
      id: 'c1',
      text: '**Важно** <script>window.__xss = true</script>',
    }),
  ]
  serve()
  renderApp('/posts/post-1/comments')

  const emphasis = await screen.findByText('Важно')
  expect(emphasis.tagName).toBe('STRONG')
  expect(document.querySelector('script')).toBeNull()
  expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined()
})

test('validation 13: attaching more than 10 files to a comment is rejected', async () => {
  serve()
  const { user } = renderApp('/posts/post-1/comments')
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
  serve()
  const { user } = renderApp('/posts/post-1/comments')
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
  serve()
  let createCalls = 0
  trpcServer.use(
    http.post(`${env.apiUrl}/comments.create`, async () => {
      createCalls += 1
      await delay('infinite')
      return HttpResponse.json([{ result: { data: { ok: true } } }])
    }),
  )
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByPlaceholderText('Наберите текст')

  await user.type(commentField(), 'Привет')
  await user.click(sendButton())

  await waitFor(() => expect(sendButton()).toBeDisabled())
  await user.click(sendButton())

  expect(createCalls).toBe(1)
})

test('error-states 6: a failed thread query shows an error while the input bar and back navigation stay usable', async () => {
  trpcServer.use(
    trpcQueries({
      'comments.list': () => {
        throw new Error('boom')
      },
      'issues.get': () => issue(),
      'posts.get': () => post(),
      'posts.list': () => ({ nextCursor: null, posts: [post()] }),
      'resident.me': () => ({
        apartment: 42,
        block: 1,
        name: 'Алиса',
        role: 'resident',
      }),
    }),
  )
  const { currentPath, user } = renderApp('/posts?tab=all')
  await screen.findByText('Продам горный велосипед')

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
  serve()
  const { currentPath, user } = renderApp('/posts?tab=all')
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
})
