import { fake, injectFake, resetFirestore } from '@raiymbek-park/api/testing'
import { screen, waitFor, within } from '@testing-library/react'
import { delay, HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { env } from '@/shared/config'
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

const makeFile = (
  name: string,
  { size, type = 'image/jpeg' }: { size?: number; type?: string } = {},
) => {
  const file = new File([], name, { type })
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size })
  return file
}

const submit = () => screen.getByRole('button', { name: 'Опубликовать' })

const titleField = () => screen.getByRole('textbox', { name: 'Заголовок' })

const descriptionField = () => screen.getByRole('textbox', { name: 'Описание' })

const fileInput = () => screen.getByLabelText('Добавить')

const ready = () => screen.findByRole('textbox', { name: 'Заголовок' })

const feedTab = (name: string) =>
  within(screen.getByRole('group', { name: 'Фильтр объявлений' })).getByRole(
    'button',
    { name },
  )

const seedResident = (role: string) =>
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

const fillValidForm = async (
  user: ReturnType<typeof renderAppWithServer>['user'],
  category: string,
  {
    title = 'Продам горный велосипед',
    description = 'Почти новый велосипед, катался месяц',
  } = {},
) => {
  await ready()
  await user.click(screen.getByRole('button', { name: new RegExp(category) }))
  await user.type(titleField(), title)
  await user.type(descriptionField(), description)
}

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  fake.reset()
  injectFake()
})

afterEach(resetFirestore)

test('happy-path 8: a Resident publishes an offer through the real backend — it is stored, shows the phone notice, and appears under Частные объявления', async () => {
  seedResident('resident')
  const { currentPath, user } = renderAppWithServer('/posts/new', {
    uid: 'uid-1',
  })

  expect(
    await screen.findByText(
      'Ваш номер телефона будет виден всем пользователям.',
    ),
  ).toBeInTheDocument()

  await fillValidForm(user, 'Услуги')
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(await screen.findByText('Продам горный велосипед')).toBeInTheDocument()
  expect(
    await screen.findByText('Объявление опубликовано.'),
  ).toBeInTheDocument()
  expect(feedTab('Частные объявления')).toHaveAttribute('aria-pressed', 'true')

  const stored = fake.listDocs('posts')
  expect(stored).toHaveLength(1)
  expect(stored[0]).toMatchObject({
    authorId: 'uid-1',
    category: 'services',
    kind: 'offer',
    title: 'Продам горный велосипед',
  })
})

test('happy-path 9: a Manager publishes an announcement through the real backend — it is stored with no phone notice and appears under Уведомления', async () => {
  seedResident('manager')
  const { currentPath, user } = renderAppWithServer('/posts/new', {
    uid: 'uid-1',
  })

  await ready()
  expect(
    screen.queryByText('Ваш номер телефона будет виден всем пользователям.'),
  ).not.toBeInTheDocument()

  await fillValidForm(user, 'Управляющая компания', {
    description: 'Плановое отключение воды на всех этажах дома',
    title: 'Отключение воды',
  })
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(await screen.findByText('Отключение воды')).toBeInTheDocument()
  expect(feedTab('Уведомления')).toHaveAttribute('aria-pressed', 'true')

  const stored = fake.listDocs('posts')
  expect(stored).toHaveLength(1)
  expect(stored[0]).toMatchObject({
    authorId: 'uid-1',
    category: 'management',
    kind: 'announcement',
    title: 'Отключение воды',
  })
})

test('a partially failed upload still publishes the offer and stores only the media that uploaded', async () => {
  seedResident('resident')
  firebaseStorage.failUploadsNamed('bad.jpg')
  const { currentPath, user } = renderAppWithServer('/posts/new', {
    uid: 'uid-1',
  })

  await fillValidForm(user, 'Услуги')
  await user.upload(fileInput(), [makeFile('ok.jpg'), makeFile('bad.jpg')])
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(
    await screen.findByText(
      'Объявление опубликовано. Файлов не загрузилось: 1',
    ),
  ).toBeInTheDocument()

  const stored = fake.listDocs('posts')
  expect(stored).toHaveLength(1)
  expect(stored[0]?.media).toHaveLength(1)
})

test('an entirely failed upload still publishes the offer with no media stored', async () => {
  seedResident('resident')
  firebaseStorage.failUploadsNamed('bad.jpg')
  const { currentPath, user } = renderAppWithServer('/posts/new', {
    uid: 'uid-1',
  })

  await fillValidForm(user, 'Услуги')
  await user.upload(fileInput(), makeFile('bad.jpg'))
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(
    await screen.findByText(
      'Объявление опубликовано. Файлов не загрузилось: 1',
    ),
  ).toBeInTheDocument()

  const stored = fake.listDocs('posts')
  expect(stored).toHaveLength(1)
  expect(stored[0]?.media).toEqual([])
})

test('validation 1 / edge-cases 12: a title under 3 characters blocks submission; 3 and 80 characters are accepted', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

  await ready()
  await user.click(screen.getByRole('button', { name: /Услуги/ }))
  await user.type(descriptionField(), 'Почти новый велосипед, катался месяц')

  await user.type(titleField(), 'ав')
  expect(submit()).toBeDisabled()

  await user.clear(titleField())
  await user.click(titleField())
  await user.paste('а'.repeat(3))
  await waitFor(() => expect(submit()).toBeEnabled())

  await user.clear(titleField())
  await user.click(titleField())
  await user.paste('а'.repeat(80))
  await waitFor(() => expect(submit()).toBeEnabled())
})

test('validation 2 / edge-cases 13: a description under 10 characters blocks submission; 10 and 1000 characters are accepted', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

  await ready()
  await user.click(screen.getByRole('button', { name: /Услуги/ }))
  await user.type(titleField(), 'Продам горный велосипед')

  await user.type(descriptionField(), 'а'.repeat(9))
  expect(submit()).toBeDisabled()

  await user.clear(descriptionField())
  await user.click(descriptionField())
  await user.paste('а'.repeat(10))
  await waitFor(() => expect(submit()).toBeEnabled())

  await user.clear(descriptionField())
  await user.click(descriptionField())
  await user.paste('а'.repeat(1000))
  await waitFor(() => expect(submit()).toBeEnabled())
})

test('validation 3: no category selected keeps the submit button disabled', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

  await ready()
  await user.type(titleField(), 'Продам горный велосипед')
  await user.type(descriptionField(), 'Почти новый велосипед, катался месяц')

  expect(submit()).toBeDisabled()
})

test('validation 4: attaching more than 10 files is rejected and no photo is added', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

  await ready()
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

test('validation 4: attaching a file over 200 MB is rejected and no photo is added', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

  await ready()
  const big = makeFile('big.mp4', {
    size: 200 * 1024 * 1024 + 1,
    type: 'video/mp4',
  })
  await user.upload(fileInput(), big)

  expect(
    await screen.findByText(
      'Файл слишком большой: суммарный размер вложений не должен превышать 200 МБ',
    ),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Удалить' }),
  ).not.toBeInTheDocument()
})

test('edge-cases 14: attaching exactly 10 files whose combined size is exactly 200 MB is accepted', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

  await ready()
  const files = Array.from({ length: 10 }, (_, index) =>
    makeFile(`photo-${index}.jpg`, {
      size: index === 0 ? 200 * 1024 * 1024 : 0,
    }),
  )
  await user.upload(fileInput(), files)

  expect(
    await screen.findByRole('button', { name: 'Удалить' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByText('Можно прикрепить не более 10 файлов'),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByText(
      'Файл слишком большой: суммарный размер вложений не должен превышать 200 МБ',
    ),
  ).not.toBeInTheDocument()
})

test('validation 11: the save action disables while the mutation is pending, and a second tap does not send a duplicate request', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

  let createCalls = 0
  trpcServer.use(
    http.post(`${env.apiUrl}/posts.create`, async () => {
      createCalls += 1
      await delay('infinite')
      return HttpResponse.json([{ result: { data: { id: 'post-x' } } }])
    }),
  )

  await fillValidForm(user, 'Услуги')
  await user.click(submit())

  await waitFor(() => expect(submit()).toBeDisabled())
  await user.click(submit())

  expect(createCalls).toBe(1)
})

test('error-states 3: a lost session during save aborts the create and preserves the entered content for retry', async () => {
  seedResident('resident')
  const { currentPath, user } = renderAppWithServer('/posts/new', {
    uid: 'uid-1',
  })

  await fillValidForm(user, 'Услуги')
  firebaseAuth.signOut()
  await user.click(submit())

  expect(
    await screen.findByText(
      'Не удалось опубликовать объявление. Попробуйте ещё раз.',
    ),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/posts/new')
  expect(titleField()).toHaveValue('Продам горный велосипед')
  expect(descriptionField()).toHaveValue('Почти новый велосипед, катался месяц')
  expect(fake.listDocs('posts')).toHaveLength(0)
})

test('error-states 4 / error-states 8: a failed create surfaces the error and preserves the entered title, description, category, and media for retry', async () => {
  seedResident('resident')
  const { currentPath, user } = renderAppWithServer('/posts/new', {
    uid: 'uid-1',
  })

  trpcServer.use(trpcMutationError('posts.create'))

  await fillValidForm(user, 'Услуги')
  await user.upload(fileInput(), makeFile('photo.jpg'))
  await user.click(submit())

  expect(
    await screen.findByText(
      'Не удалось опубликовать объявление. Попробуйте ещё раз.',
    ),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/posts/new')
  expect(titleField()).toHaveValue('Продам горный велосипед')
  expect(descriptionField()).toHaveValue('Почти новый велосипед, катался месяц')
  expect(screen.getByRole('button', { name: /Услуги/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument()
  expect(submit()).toBeEnabled()
  expect(fake.listDocs('posts')).toHaveLength(0)
})
