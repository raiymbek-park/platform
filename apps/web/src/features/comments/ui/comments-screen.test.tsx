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
    name: 'Alice',
    phone: '+77781234455',
    role,
  })

const seedPost = (overrides: Record<string, unknown> = {}) =>
  fake.seed('posts/post-1', {
    author: {
      apartment: 42,
      block: 1,
      name: 'Alice',
      phone: '+7 700 000 00 00',
    },
    authorId: 'author-uid',
    category: 'sell',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1000),
    description: 'Post description for testing the comment thread.',
    keywords: ['bike'],
    kind: 'offer',
    lang: 'ru',
    media: [],
    reactions: {},
    title: 'Selling a mountain bike',
    ...overrides,
  })

const seedIssue = (overrides: Record<string, unknown> = {}) =>
  fake.seed('issues/issue-1', {
    author: { apartment: 12, block: 1, name: 'George Lucas' },
    authorId: 'author-uid',
    category: 'other',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1000),
    description: "The entrance intercom won't open the door with a key",
    keywords: ['intercom'],
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

const seedComment = (path: string, overrides: Record<string, unknown> = {}) =>
  fake.seed(path, {
    author: { apartment: 12, block: 1, name: 'Jackie Chan' },
    authorId: 'author-uid',
    createdAt: Timestamp.fromMillis(1000),
    lang: 'ru',
    media: [],
    text: 'Great offer',
    ...overrides,
  })

const mineComment = (
  path: string,
  text: string,
  createdAt = 2000,
): [string, Record<string, unknown>] => [
  path,
  {
    author: { apartment: 42, block: 1, name: 'Alice' },
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

const commentButton = () => screen.getByRole('button', { name: /Comments/ })

const commentField = () => screen.getByPlaceholderText('Type a message')

const sendButton = () => screen.getByRole('button', { name: 'Submit' })

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
    text: 'Great offer',
  })
  seedComment(...mineComment('posts/post-1/comments/c2', 'Thanks!'))
  const { currentPath, user } = renderAppWithServer('/posts?tab=all', {
    uid: 'uid-1',
  })
  await screen.findByText('Selling a mountain bike')

  await user.click(commentButton())

  expect(currentPath()).toBe('/posts/post-1/comments')
  expect(await screen.findByText('Selling a mountain bike')).toBeInTheDocument()
  expect(await screen.findByText('Great offer')).toBeInTheDocument()
  expect(screen.getByText('Thanks!')).toBeInTheDocument()
  expect(screen.getByText('JC')).toBeInTheDocument()
  expect(document.querySelectorAll('img').length).toBeGreaterThan(0)
})

test('edge-cases 7: the same thread reused on an issue shows its title and messages identically', async () => {
  seedResident()
  seedIssue({ commentCount: 1 })
  seedComment('issues/issue-1/comments/i1', {
    text: 'When will you fix the intercom?',
  })
  renderAppWithServer('/issues/issue-1/comments', { uid: 'uid-1' })

  expect(await screen.findByText('The intercom is broken')).toBeInTheDocument()
  expect(
    await screen.findByText('When will you fix the intercom?'),
  ).toBeInTheDocument()
  expect(commentField()).toBeInTheDocument()
})

test('edge-cases 7: writing a comment on an issue appends it and increments the issue’s comment count identically to a post', async () => {
  seedResident()
  seedIssue({ commentCount: 0 })
  const { currentPath, user } = renderAppWithServer('/issues?status=all', {
    uid: 'uid-1',
  })
  await screen.findByText('The intercom is broken')
  const issueCommentButton = () =>
    screen.getByRole('button', { name: /Comments/ })
  expect(within(issueCommentButton()).getByText('0')).toBeInTheDocument()

  await user.click(issueCommentButton())
  expect(currentPath()).toBe('/issues/issue-1/comments')

  await user.type(commentField(), 'When do you plan to fix it?')
  await user.click(sendButton())
  expect(
    await screen.findByText('When do you plan to fix it?'),
  ).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Back' }))
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
  seedComment('posts/post-1/comments/c1', { text: 'Great offer' })
  renderAppWithServer('/posts/post-1/comments', { uid: 'uid-1' })
  await screen.findByText('Great offer')

  expect(
    screen.queryByPlaceholderText('Type a message'),
  ).not.toBeInTheDocument()
})

test('happy-path 14: writing a comment with text and an image appends it to the thread and increments the post’s comment count', async () => {
  seedResident()
  seedPost({ commentCount: 0 })
  const { currentPath, user } = renderAppWithServer('/posts?tab=all', {
    uid: 'uid-1',
  })
  await screen.findByText('Selling a mountain bike')
  expect(within(commentButton()).getByText('0')).toBeInTheDocument()

  await user.click(commentButton())
  expect(currentPath()).toBe('/posts/post-1/comments')

  await user.upload(fileInput(), makeFile('photo.jpg'))
  await user.type(commentField(), 'Hello, is this still available?')
  await user.click(sendButton())

  expect(
    await screen.findByText('Hello, is this still available?'),
  ).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Back' }))
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
  await screen.findByPlaceholderText('Type a message')

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
  await screen.findByPlaceholderText('Type a message')

  await user.click(commentField())
  await user.paste('a'.repeat(1005))

  expect(commentField()).toHaveValue('a'.repeat(1000))
  expect(sendButton()).toBeEnabled()
})

test('validation 6a: a comment with raw HTML and a script tag renders only the safe Markdown subset', async () => {
  seedResident()
  seedPost({ commentCount: 1 })
  seedComment('posts/post-1/comments/c1', {
    text: '**Important** <script>window.__xss = true</script>',
  })
  renderAppWithServer('/posts/post-1/comments', { uid: 'uid-1' })

  const emphasis = await screen.findByText('Important')
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
  await screen.findByPlaceholderText('Type a message')

  const files = Array.from({ length: 11 }, (_, index) =>
    makeFile(`photo-${index}.jpg`),
  )
  await user.upload(fileInput(), files)

  expect(
    await screen.findByText('You can attach at most 10 files'),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Delete' }),
  ).not.toBeInTheDocument()
})

test('edge-cases 16: attaching exactly 10 media items whose combined size is exactly 200 MB is accepted for a comment', async () => {
  seedResident()
  seedPost()
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByPlaceholderText('Type a message')

  const files = Array.from({ length: 10 }, (_, index) =>
    makeFile(`photo-${index}.jpg`, {
      size: index === 0 ? 200 * 1024 * 1024 : 0,
    }),
  )
  await user.upload(fileInput(), files)

  expect(await screen.findAllByRole('button', { name: 'Delete' })).toHaveLength(
    10,
  )
  expect(
    screen.queryByText('You can attach at most 10 files'),
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
  await screen.findByPlaceholderText('Type a message')
  trpcServer.use(
    http.post(`${env.apiUrl}/comments.create`, async () => {
      createCalls += 1
      await delay('infinite')
      return HttpResponse.json([{ result: { data: { ok: true } } }])
    }),
  )

  await user.type(commentField(), 'Hello')
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
  await screen.findByText('Selling a mountain bike')
  breakCommentsList()

  await user.click(commentButton())

  expect(
    await screen.findByTestId('comment-error', undefined, { timeout: 4000 }),
  ).toBeInTheDocument()
  await user.type(commentField(), 'Still available')
  expect(commentField()).toHaveValue('Still available')

  await user.click(screen.getByRole('button', { name: 'Back' }))
  await waitFor(() => expect(currentPath()).toBe('/posts'))
})

test('error-states 7 / error-states 9: a failed send surfaces an error, preserves the entered text and photo, and leaves the comment count unchanged', async () => {
  seedResident()
  seedPost({ commentCount: 0 })
  const { currentPath, user } = renderAppWithServer('/posts?tab=all', {
    uid: 'uid-1',
  })
  await screen.findByText('Selling a mountain bike')
  await user.click(commentButton())
  await screen.findByPlaceholderText('Type a message')
  trpcServer.use(trpcMutationError('comments.create'))

  await user.upload(fileInput(), makeFile('photo.jpg'))
  await user.type(commentField(), 'Still available?')
  await user.click(sendButton())

  expect(
    await screen.findByText('Failed to send the message. Please try again.'),
  ).toBeInTheDocument()
  expect(commentField()).toHaveValue('Still available?')
  expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Back' }))
  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(within(commentButton()).getByText('0')).toBeInTheDocument()
  expect(fake.getDoc('posts/post-1')?.commentCount).toBe(0)
})
