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
    name: 'Алиса',
    phone: '+77781234455',
    role: 'resident',
  })

const seedPost = (overrides: Record<string, unknown> = {}) =>
  fake.seed('posts/post-1', {
    author: {
      apartment: 12,
      block: 3,
      name: 'Алиса',
      phone: '+7 700 000 00 00',
    },
    authorId: 'uid-1',
    category: 'sell',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(1_700_000_000_000),
    description:
      'Продаю велосипед в отличном состоянии, почти не использовался',
    keywords: [],
    kind: 'offer',
    lang: 'ru',
    media: [],
    reactions: {},
    title: 'Продам горный велосипед',
    ...overrides,
  })

const titleField = () => screen.getByRole('textbox', { name: 'Заголовок' })

const descriptionField = () => screen.getByRole('textbox', { name: 'Описание' })

const fileInput = () => screen.getByLabelText('Добавить')

const submit = () => screen.getByRole('button', { name: 'Сохранить' })

const ready = () => screen.findByRole('textbox', { name: 'Заголовок' })

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
  expect(titleField()).toHaveValue('Продам горный велосипед')
  expect(descriptionField()).toHaveValue(
    'Продаю велосипед в отличном состоянии, почти не использовался',
  )
  expect(screen.getByRole('button', { name: /Продам/ })).toHaveAttribute(
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
    screen.queryByRole('group', { name: 'Тип объявления' }),
  ).not.toBeInTheDocument()
})

test('happy-path 10a: saving an edited title runs the real update — the feed reflects it and the kind stays unchanged', async () => {
  seedResident()
  seedPost()
  const { currentPath, user } = renderAppWithServer('/posts/edit/post-1', {
    uid: 'uid-1',
  })

  await ready()
  await user.clear(titleField())
  await user.type(titleField(), 'Продам городской велосипед')
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(
    await screen.findByText('Продам городской велосипед'),
  ).toBeInTheDocument()
  expect(await screen.findByText('Изменения сохранены.')).toBeInTheDocument()
  expect(feedTab('Частные объявления')).toHaveAttribute('aria-pressed', 'true')

  const stored = fake.getDoc('posts/post-1')
  expect(stored?.title).toBe('Продам городской велосипед')
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
    await screen.findByText('Изменения сохранены. Файлов не загрузилось: 1'),
  ).toBeInTheDocument()
  expect(fake.getDoc('posts/post-1')?.media).toHaveLength(1)
})

test('error-states: a NOT_FOUND from the real backend redirects to the feed with a not-found toast', async () => {
  seedResident()
  seedPost()
  const { currentPath, user } = renderAppWithServer('/posts/edit/post-1', {
    uid: 'uid-1',
  })

  await ready()
  fake.reset()
  seedResident()
  await user.clear(titleField())
  await user.type(titleField(), 'Продам городской велосипед')
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(await screen.findByText('Объявление не найдено.')).toBeInTheDocument()
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
  await user.type(titleField(), 'Продам городской велосипед')
  await user.click(submit())

  expect(
    await screen.findByText(
      'Не удалось сохранить изменения. Попробуйте ещё раз.',
    ),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/posts/edit/post-1')
  expect(titleField()).toHaveValue('Продам городской велосипед')
  expect(fake.getDoc('posts/post-1')?.title).toBe('Продам горный велосипед')
})
