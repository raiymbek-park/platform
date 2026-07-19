import {
  fake,
  injectFake,
  resetFirestore,
  Timestamp,
} from '@raiymbek-park/api/testing'
import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { firebaseAuth, trpcMutationError, trpcServer } from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

if (!URL.createObjectURL)
  Object.assign(URL, {
    createObjectURL: () => 'blob:x',
    revokeObjectURL: () => {},
  })

const makeFile = (name: string) => new File(['x'], name, { type: 'image/jpeg' })

const seedManager = () =>
  fake.seed('residents/uid-1', {
    apartment: 42,
    avatarUrl: null,
    block: 1,
    cars: [],
    isPhoneVisible: false,
    name: 'Johnny Depp',
    phone: '+77781234455',
    role: 'manager',
  })

const seedIssue = () =>
  fake.seed('issues/issue-115', {
    author: { apartment: 12, block: 1, name: 'George Lucas' },
    authorId: 'author-uid',
    category: 'replacement',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1_700_000_000_000),
    description: 'The elevator cables in block one are worn',
    keywords: [],
    lang: 'ru',
    media: [],
    number: 115,
    reactions: {},
    status: 'in-progress',
    tags: ['warranty'],
    title: 'Elevator cable replacement',
    urgent: false,
  })

const submit = () => screen.getByRole('button', { name: 'Save' })

const ready = () => screen.findByText('Change status')

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  fake.reset()
  injectFake()
})

afterEach(resetFirestore)

test('happy-path: the form preselects the current status and existing tags', async () => {
  seedManager()
  seedIssue()
  renderAppWithServer('/issues/status/issue-115', { uid: 'uid-1' })

  await ready()
  expect(screen.getByRole('button', { name: /In progress/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(
    screen.getByRole('button', { name: /Under warranty/ }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('happy-path: a Manager changes the status — it stores the new status, returns to the matching filter, and confirms with a toast', async () => {
  seedManager()
  seedIssue()
  const { currentPath, user } = renderAppWithServer(
    '/issues/status/issue-115',
    {
      uid: 'uid-1',
    },
  )

  await ready()
  await user.click(screen.getByRole('button', { name: /Done/ }))
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  expect(await screen.findByText('Status updated.')).toBeInTheDocument()
  expect(fake.getDoc('issues/issue-115')?.status).toBe('done')
})

test('happy-path: a comment, a tag change, and a photo are persisted as a status change', async () => {
  seedManager()
  seedIssue()
  const { user } = renderAppWithServer('/issues/status/issue-115', {
    uid: 'uid-1',
  })

  await ready()
  await user.click(screen.getByRole('button', { name: /Duplicate/ }))
  await user.type(
    screen.getByRole('textbox', { name: 'Comment' }),
    'Work completed',
  )
  await user.upload(screen.getByLabelText('Add'), makeFile('fix.jpg'))
  await user.click(submit())

  await waitFor(() =>
    expect(fake.listDocs('issues/issue-115/statusChanges')).toHaveLength(1),
  )
  const [change] = fake.listDocs('issues/issue-115/statusChanges')
  expect(change?.comment).toBe('Work completed')
  expect(change?.tags).toEqual(
    expect.arrayContaining(['warranty', 'duplicate']),
  )
  expect(change?.media).toHaveLength(1)
  expect(fake.listDocs('issues/issue-115/comments')).toHaveLength(1)
})

test('error-states: a failed status change shows an error toast, keeps the form, and leaves the status unchanged', async () => {
  seedManager()
  seedIssue()
  const { currentPath, user } = renderAppWithServer(
    '/issues/status/issue-115',
    {
      uid: 'uid-1',
    },
  )

  await ready()
  trpcServer.use(trpcMutationError('issues.changeStatus'))
  await user.click(screen.getByRole('button', { name: /Done/ }))
  await user.click(submit())

  expect(
    await screen.findByText('Could not change the status. Please try again.'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/issues/status/issue-115')
  expect(fake.getDoc('issues/issue-115')?.status).toBe('in-progress')
})
