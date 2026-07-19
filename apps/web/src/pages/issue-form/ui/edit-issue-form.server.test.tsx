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
    name: 'Алиса',
    phone: '+77781234455',
    role: 'resident',
  })

const seedIssue = () =>
  fake.seed('issues/issue-1', {
    author: { apartment: 42, block: 1, name: 'Алиса' },
    authorId: 'uid-1',
    category: 'repair',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1_700_000_000_000),
    description: 'Кран на кухне течёт уже неделю, нужен мастер',
    keywords: [],
    lang: 'ru',
    media: [],
    number: 42,
    reactions: {},
    status: 'new',
    tags: [],
    title: 'Течёт кран на кухне',
    urgent: false,
  })

const titleField = () => screen.getByRole('textbox', { name: 'Тема заявки' })

const descriptionField = () => screen.getByRole('textbox', { name: 'Описание' })

const submit = () => screen.getByRole('button', { name: 'Сохранить' })

const ready = () => screen.findByRole('textbox', { name: 'Тема заявки' })

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
  expect(titleField()).toHaveValue('Течёт кран на кухне')
  expect(descriptionField()).toHaveValue(
    'Кран на кухне течёт уже неделю, нужен мастер',
  )
  expect(screen.getByRole('button', { name: /Ремонт/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('happy-path: editing the title and saving runs the real update — the stored issue changes and the list confirms with a toast', async () => {
  seedResident()
  seedIssue()
  const { currentPath, user } = renderAppWithServer('/issues/edit/issue-1', {
    uid: 'uid-1',
  })

  await ready()
  await user.clear(titleField())
  await user.type(titleField(), 'Течёт кран в ванной')
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  expect(await screen.findByText('Изменения сохранены.')).toBeInTheDocument()
  expect(fake.getDoc('issues/issue-1')?.title).toBe('Течёт кран в ванной')
})

test('validation: clearing the title below three characters disables save', async () => {
  seedResident()
  seedIssue()
  const { user } = renderAppWithServer('/issues/edit/issue-1', { uid: 'uid-1' })

  await ready()
  await user.clear(titleField())
  await user.type(titleField(), 'ав')

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
  await user.type(titleField(), 'Течёт кран в ванной')
  await user.click(submit())

  expect(
    await screen.findByText(
      'Не удалось сохранить изменения. Попробуйте ещё раз.',
    ),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/issues/edit/issue-1')
  expect(titleField()).toHaveValue('Течёт кран в ванной')
  expect(fake.getDoc('issues/issue-1')?.title).toBe('Течёт кран на кухне')
})
