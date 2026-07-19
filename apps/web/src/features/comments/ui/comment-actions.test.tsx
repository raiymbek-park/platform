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

const seedMine = (path: string, text: string, createdAt = 1000) =>
  fake.seed(path, {
    author: { apartment: 42, block: 1, name: 'Alice' },
    authorId: 'uid-1',
    createdAt: Timestamp.fromMillis(createdAt),
    lang: 'ru',
    media: [],
    text,
  })

const seedOther = (path: string, text: string, createdAt = 2000) =>
  fake.seed(path, {
    author: { apartment: 12, block: 1, name: 'Jackie Chan' },
    authorId: 'author-uid',
    createdAt: Timestamp.fromMillis(createdAt),
    lang: 'ru',
    media: [],
    text,
  })

const commentButton = () => screen.getByRole('button', { name: /Comments/ })

const commentField = () => screen.getByPlaceholderText('Type a message')

const messageRow = (text: string) => {
  const row = screen.getByText(text).parentElement?.parentElement?.parentElement
  if (!row) throw new Error(`row for "${text}" not found`)
  return row
}

const messageActions = (text: string) =>
  within(messageRow(text)).queryByTitle('Message actions')

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
  seedMine('posts/post-1/comments/c1', 'Original text')
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByText('Original text')

  const sheet = await openActions(user, 'Original text')
  await user.click(within(sheet).getByRole('button', { name: 'Edit' }))

  expect(commentField()).toHaveValue('Original text')
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
})

test('happy-path 15a: saving an edited comment updates the message in place', async () => {
  seedResident()
  seedPost({ commentCount: 1 })
  seedMine('posts/post-1/comments/c1', 'Original text')
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByText('Original text')

  const sheet = await openActions(user, 'Original text')
  await user.click(within(sheet).getByRole('button', { name: 'Edit' }))
  await user.clear(commentField())
  await user.type(commentField(), 'Updated text')
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByText('Updated text')).toBeInTheDocument()
  expect(screen.queryByText('Original text')).not.toBeInTheDocument()
  await waitFor(() =>
    expect(fake.getDoc('posts/post-1/comments/c1')?.text).toBe('Updated text'),
  )
})

test('happy-path 16: the author deletes their own comment and the count decreases by one', async () => {
  seedResident()
  seedPost({ commentCount: 1 })
  seedMine('posts/post-1/comments/c1', 'Delete me')
  const { currentPath, user } = renderAppWithServer('/posts?tab=all', {
    uid: 'uid-1',
  })
  await screen.findByText('Selling a mountain bike')
  expect(within(commentButton()).getByText('1')).toBeInTheDocument()

  await user.click(commentButton())
  await screen.findByText('Delete me')

  const sheet = await openActions(user, 'Delete me')
  await user.click(
    within(sheet).getByRole('button', { name: 'Delete message' }),
  )
  const confirmDialog = await screen.findByRole('dialog')
  await user.click(
    within(confirmDialog).getByRole('button', { name: 'Delete' }),
  )

  expect(await screen.findByText('Message deleted.')).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.queryByText('Delete me')).not.toBeInTheDocument(),
  )

  await user.click(screen.getByRole('button', { name: 'Back' }))
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
  seedOther('posts/post-1/comments/c1', "Someone else's message")
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByText("Someone else's message")

  const sheet = await openActions(user, "Someone else's message")
  expect(
    within(sheet).queryByRole('button', { name: 'Edit' }),
  ).not.toBeInTheDocument()
  await user.click(
    within(sheet).getByRole('button', { name: 'Delete message' }),
  )
  const confirmDialog = await screen.findByRole('dialog')
  await user.click(
    within(confirmDialog).getByRole('button', { name: 'Delete' }),
  )

  expect(await screen.findByText('Message deleted.')).toBeInTheDocument()
  await waitFor(() =>
    expect(
      screen.queryByText("Someone else's message"),
    ).not.toBeInTheDocument(),
  )
  expect(fake.getDoc('posts/post-1/comments/c1')).toBeUndefined()
})

test('validation 15: canceling the delete confirmation leaves the comment in the thread', async () => {
  seedResident()
  seedPost({ commentCount: 1 })
  seedMine('posts/post-1/comments/c1', "Don't delete me")
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByText("Don't delete me")

  const sheet = await openActions(user, "Don't delete me")
  await user.click(
    within(sheet).getByRole('button', { name: 'Delete message' }),
  )
  const dialog = await screen.findByRole('dialog')
  await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  )
  expect(screen.getByText("Don't delete me")).toBeInTheDocument()
  expect(fake.getDoc('posts/post-1/comments/c1')).toBeDefined()
})

test('edge-cases 17: a member sees actions only on their own comment', async () => {
  seedResident('resident')
  seedPost({ commentCount: 2 })
  seedMine('posts/post-1/comments/own', 'My message', 1000)
  seedOther('posts/post-1/comments/other', "Someone else's message", 2000)
  renderAppWithServer('/posts/post-1/comments', { uid: 'uid-1' })
  await screen.findByText('My message')

  expect(messageActions('My message')).not.toBeNull()
  expect(messageActions("Someone else's message")).toBeNull()
})

test('edge-cases 17: Administration sees the delete action on every comment', async () => {
  seedResident('administration')
  seedPost({ commentCount: 1 })
  seedOther('posts/post-1/comments/other', "Someone else's message")
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByText("Someone else's message")

  const sheet = await openActions(user, "Someone else's message")
  expect(
    within(sheet).getByRole('button', { name: 'Delete message' }),
  ).toBeInTheDocument()
})

test('error-states 7 / error-states 9: a failed edit surfaces an error and keeps the edited text in edit mode', async () => {
  seedResident()
  seedPost({ commentCount: 1 })
  seedMine('posts/post-1/comments/c1', 'Original text')
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByText('Original text')

  const sheet = await openActions(user, 'Original text')
  await user.click(within(sheet).getByRole('button', { name: 'Edit' }))
  await user.clear(commentField())
  await user.type(commentField(), 'Edited text')
  trpcServer.use(trpcMutationError('comments.update'))
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(
    await screen.findByText('Could not save the changes. Please try again.'),
  ).toBeInTheDocument()
  expect(commentField()).toHaveValue('Edited text')
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
})

test('error-states 7 / error-states 9: a failed delete leaves the message visible in the thread', async () => {
  seedResident()
  seedPost({ commentCount: 1 })
  seedMine('posts/post-1/comments/c1', 'Stay put')
  const { user } = renderAppWithServer('/posts/post-1/comments', {
    uid: 'uid-1',
  })
  await screen.findByText('Stay put')

  const sheet = await openActions(user, 'Stay put')
  await user.click(
    within(sheet).getByRole('button', { name: 'Delete message' }),
  )
  const confirmDialog = await screen.findByRole('dialog')
  trpcServer.use(trpcMutationError('comments.delete'))
  await user.click(
    within(confirmDialog).getByRole('button', { name: 'Delete' }),
  )

  expect(
    await screen.findByText('Failed to delete the message. Please try again.'),
  ).toBeInTheDocument()
  expect(screen.getByText('Stay put')).toBeInTheDocument()
  expect(fake.getDoc('posts/post-1/comments/c1')).toBeDefined()
})

test('edge-cases 7: deleting a comment on an issue decrements the issue’s comment count identically to a post', async () => {
  seedResident()
  seedIssue({ commentCount: 1 })
  seedMine('issues/issue-1/comments/i1', 'Delete me')
  const { currentPath, user } = renderAppWithServer('/issues?status=all', {
    uid: 'uid-1',
  })
  await screen.findByText('The intercom is broken')
  const issueCommentButton = () =>
    screen.getByRole('button', { name: /Comments/ })
  expect(within(issueCommentButton()).getByText('1')).toBeInTheDocument()

  await user.click(issueCommentButton())
  await screen.findByText('Delete me')

  const sheet = await openActions(user, 'Delete me')
  await user.click(
    within(sheet).getByRole('button', { name: 'Delete message' }),
  )
  const confirmDialog = await screen.findByRole('dialog')
  await user.click(
    within(confirmDialog).getByRole('button', { name: 'Delete' }),
  )

  expect(await screen.findByText('Message deleted.')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Back' }))
  await waitFor(() => expect(currentPath()).toBe('/issues'))
  await waitFor(() =>
    expect(within(issueCommentButton()).getByText('0')).toBeInTheDocument(),
  )
  expect(fake.getDoc('issues/issue-1')?.commentCount).toBe(0)
})
