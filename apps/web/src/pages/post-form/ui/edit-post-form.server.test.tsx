import {
  fake,
  injectFake,
  resetFirestore,
  Timestamp,
} from '@raiymbek-park/api/testing'
import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'

import {
  firebaseAuth,
  firebaseStorage,
  trpcMutationError,
  trpcServer,
} from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

if (!URL.createObjectURL)
  Object.assign(URL, {
    createObjectURL: () => 'blob:x',
    revokeObjectURL: () => {},
  })

const makeFile = (name: string) => new File([], name, { type: 'image/jpeg' })

const seedResident = () =>
  fake.seed('residents/uid-1', {
    apartment: 42,
    avatarUrl: null,
    block: 1,
    cars: [],
    isPhoneVisible: false,
    name: 'Alice',
    phone: '+77781234455',
    role: 'resident',
  })

const seedPost = (overrides: Record<string, unknown> = {}) =>
  fake.seed('posts/post-1', {
    author: {
      apartment: 12,
      block: 3,
      name: 'Alice',
      phone: '+7 700 000 00 00',
    },
    authorId: 'uid-1',
    category: 'sell',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1_700_000_000_000),
    description: 'Selling a bike in excellent condition, barely used',
    keywords: [],
    kind: 'offer',
    lang: 'ru',
    media: [],
    reactions: {},
    title: 'Selling a mountain bike',
    ...overrides,
  })

const titleField = () => screen.getByRole('textbox', { name: 'Title' })

const descriptionField = () =>
  screen.getByRole('textbox', { name: 'Description' })

const fileInput = () => screen.getByLabelText('Add')

const submit = () => screen.getByRole('button', { name: 'Save' })

const ready = () => screen.findByRole('textbox', { name: 'Title' })

const feedTab = (name: string) =>
  within(screen.getByRole('group', { name: 'Фильтр объявлений' })).getByRole(
    'button',
    { name },
  )

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  firebaseStorage.reset()
  fake.reset()
  injectFake()
})

afterEach(resetFirestore)

test('happy-path 10: opening edit pre-fills the offer form with the post’s current values', async () => {
  seedResident()
  seedPost()
  renderAppWithServer('/posts/edit/post-1', { uid: 'uid-1' })

  await ready()
  expect(titleField()).toHaveValue('Selling a mountain bike')
  expect(descriptionField()).toHaveValue(
    'Selling a bike in excellent condition, barely used',
  )
  expect(screen.getByRole('button', { name: /For sale/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('validation 7: the kind is not editable — no kind switcher is offered while editing', async () => {
  seedResident()
  seedPost()
  renderAppWithServer('/posts/edit/post-1', { uid: 'uid-1' })

  await ready()
  expect(
    screen.queryByRole('group', { name: 'Post type' }),
  ).not.toBeInTheDocument()
})

test('happy-path 10a: saving an edited title updates the feed and leaves the kind unchanged', async () => {
  seedResident()
  seedPost()
  const { currentPath, user } = renderAppWithServer('/posts/edit/post-1', {
    uid: 'uid-1',
  })

  await ready()
  await user.clear(titleField())
  await user.type(titleField(), 'Selling a city bike')
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(await screen.findByText('Selling a city bike')).toBeInTheDocument()
  expect(await screen.findByText('Changes saved.')).toBeInTheDocument()
  expect(feedTab('Private ads')).toHaveAttribute('aria-pressed', 'true')

  const stored = fake.getDoc('posts/post-1')
  expect(stored?.title).toBe('Selling a city bike')
  expect(stored?.kind).toBe('offer')
})

test('a partially failed re-upload still saves the edit and stores only the media that uploaded', async () => {
  seedResident()
  seedPost()
  firebaseStorage.failUploadsNamed('bad.jpg')
  const { currentPath, user } = renderAppWithServer('/posts/edit/post-1', {
    uid: 'uid-1',
  })

  await ready()
  await user.upload(fileInput(), [makeFile('ok.jpg'), makeFile('bad.jpg')])
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(
    await screen.findByText('Changes saved. Files not uploaded: 1'),
  ).toBeInTheDocument()
  expect(fake.getDoc('posts/post-1')?.media).toHaveLength(1)
})

test('error-states: a NOT_FOUND from the backend redirects to the feed with a not-found toast', async () => {
  seedResident()
  seedPost()
  const { currentPath, user } = renderAppWithServer('/posts/edit/post-1', {
    uid: 'uid-1',
  })

  await ready()
  fake.reset()
  seedResident()
  await user.clear(titleField())
  await user.type(titleField(), 'Selling a city bike')
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(await screen.findByText('Post not found.')).toBeInTheDocument()
})

test('error-states 4: a failed edit shows an error toast and preserves the form input for retry', async () => {
  seedResident()
  seedPost()
  const { currentPath, user } = renderAppWithServer('/posts/edit/post-1', {
    uid: 'uid-1',
  })

  await ready()
  trpcServer.use(trpcMutationError('posts.update'))
  await user.clear(titleField())
  await user.type(titleField(), 'Selling a city bike')
  await user.click(submit())

  expect(
    await screen.findByText('Could not save the changes. Please try again.'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/posts/edit/post-1')
  expect(titleField()).toHaveValue('Selling a city bike')
  expect(fake.getDoc('posts/post-1')?.title).toBe('Selling a mountain bike')
})
