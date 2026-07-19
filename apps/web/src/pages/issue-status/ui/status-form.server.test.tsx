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
    name: 'Менеджер',
    phone: '+77781234455',
    role: 'manager',
  })

const seedIssue = () =>
  fake.seed('issues/issue-115', {
    author: { apartment: 12, block: 1, name: 'Житель' },
    authorId: 'author-uid',
    category: 'replacement',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1_700_000_000_000),
    description: 'Изношены тросы лифта в первом блоке',
    keywords: [],
    lang: 'ru',
    media: [],
    number: 115,
    reactions: {},
    status: 'in-progress',
    tags: ['warranty'],
    title: 'Замена тросов лифта',
    urgent: false,
  })

const submit = () => screen.getByRole('button', { name: 'Сохранить' })

const ready = () => screen.findByText('Смена статуса')

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
  expect(screen.getByRole('button', { name: /В работе/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('button', { name: /По гарантии/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('happy-path: a Manager changes the status — the real backend stores the new status, returns to the matching filter, and confirms with a toast', async () => {
  seedManager()
  seedIssue()
  const { currentPath, user } = renderAppWithServer(
    '/issues/status/issue-115',
    {
      uid: 'uid-1',
    },
  )

  await ready()
  await user.click(screen.getByRole('button', { name: /Выполнено/ }))
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  expect(await screen.findByText('Статус обновлён.')).toBeInTheDocument()
  expect(fake.getDoc('issues/issue-115')?.status).toBe('done')
})

test('happy-path: a comment, a tag change, and a photo are persisted by the real backend as a status change', async () => {
  seedManager()
  seedIssue()
  const { user } = renderAppWithServer('/issues/status/issue-115', {
    uid: 'uid-1',
  })

  await ready()
  await user.click(screen.getByRole('button', { name: /Дубликат/ }))
  await user.type(
    screen.getByRole('textbox', { name: 'Комментарий' }),
    'Работы выполнены',
  )
  await user.upload(screen.getByLabelText('Добавить'), makeFile('fix.jpg'))
  await user.click(submit())

  await waitFor(() =>
    expect(fake.listDocs('issues/issue-115/statusChanges')).toHaveLength(1),
  )
  const [change] = fake.listDocs('issues/issue-115/statusChanges')
  expect(change?.comment).toBe('Работы выполнены')
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
  await user.click(screen.getByRole('button', { name: /Выполнено/ }))
  await user.click(submit())

  expect(
    await screen.findByText('Не удалось сменить статус. Попробуйте ещё раз.'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/issues/status/issue-115')
  expect(fake.getDoc('issues/issue-115')?.status).toBe('in-progress')
})
