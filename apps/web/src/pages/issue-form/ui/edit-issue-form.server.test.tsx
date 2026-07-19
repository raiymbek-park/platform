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

const seedIssue = () =>
  fake.seed('issues/issue-1', {
    author: { apartment: 42, block: 1, name: 'Alice' },
    authorId: 'uid-1',
    category: 'repair',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1_700_000_000_000),
    description: 'The kitchen tap has been dripping for a week, need a plumber',
    keywords: [],
    lang: 'ru',
    media: [],
    number: 42,
    reactions: {},
    status: 'new',
    tags: [],
    title: "Kitchen tap won't stop dripping",
    urgent: false,
  })

const titleField = () => screen.getByRole('textbox', { name: 'Issue title' })

const descriptionField = () =>
  screen.getByRole('textbox', { name: 'Description' })

const submit = () => screen.getByRole('button', { name: 'Save' })

const ready = () => screen.findByRole('textbox', { name: 'Issue title' })

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  fake.reset()
  injectFake()
})

afterEach(resetFirestore)

test('happy-path: the edit form is prefilled with the current issue values', async () => {
  seedResident()
  seedIssue()
  renderAppWithServer('/issues/edit/issue-1', { uid: 'uid-1' })

  await ready()
  expect(titleField()).toHaveValue("Kitchen tap won't stop dripping")
  expect(descriptionField()).toHaveValue(
    'The kitchen tap has been dripping for a week, need a plumber',
  )
  expect(screen.getByRole('button', { name: /Repair/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('happy-path: editing the title and saving updates the stored issue and confirms in the list with a toast', async () => {
  seedResident()
  seedIssue()
  const { currentPath, user } = renderAppWithServer('/issues/edit/issue-1', {
    uid: 'uid-1',
  })

  await ready()
  await user.clear(titleField())
  await user.type(titleField(), "Bathroom tap won't stop dripping")
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  expect(await screen.findByText('Changes saved.')).toBeInTheDocument()
  expect(fake.getDoc('issues/issue-1')?.title).toBe(
    "Bathroom tap won't stop dripping",
  )
})

test('validation: clearing the title below three characters disables save', async () => {
  seedResident()
  seedIssue()
  const { user } = renderAppWithServer('/issues/edit/issue-1', { uid: 'uid-1' })

  await ready()
  await user.clear(titleField())
  await user.type(titleField(), 'ab')

  expect(submit()).toBeDisabled()
})

test('error-states: a failed update shows an error toast, keeps the form, and stores nothing', async () => {
  seedResident()
  seedIssue()
  const { currentPath, user } = renderAppWithServer('/issues/edit/issue-1', {
    uid: 'uid-1',
  })

  await ready()
  trpcServer.use(trpcMutationError('issues.update'))
  await user.clear(titleField())
  await user.type(titleField(), "Bathroom tap won't stop dripping")
  await user.click(submit())

  expect(
    await screen.findByText('Could not save the changes. Please try again.'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/issues/edit/issue-1')
  expect(titleField()).toHaveValue("Bathroom tap won't stop dripping")
  expect(fake.getDoc('issues/issue-1')?.title).toBe(
    "Kitchen tap won't stop dripping",
  )
})
