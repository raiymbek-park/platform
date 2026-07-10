import type { Post } from '@raiymbek-park/api'
import type {
  PermissionRole,
  PostCreatePayload,
} from '@raiymbek-park/shared/validation-schemas'

import { postCreatePayloadSchema } from '@raiymbek-park/shared/validation-schemas'
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

let posts: Post[] = []
let lastCreatePayload: PostCreatePayload | null = null

const toPost = (payload: PostCreatePayload): Post => ({
  author: {
    apartment: 42,
    block: 1,
    name: 'Алиса',
    ...(payload.kind === 'offer' ? { phone: '+7 747 000 11 22' } : {}),
  },
  category: payload.category,
  commentCount: 0,
  createdAt: Date.now(),
  description: payload.description,
  dislikeCount: 0,
  id: payload.id,
  isMine: true,
  isPinned: false,
  isTranslated: false,
  keywords: [],
  kind: payload.kind,
  likeCount: 0,
  media: payload.media,
  myReaction: null,
  original: null,
  originalLang: 'ru',
  title: payload.title,
})

const serve = (role: PermissionRole = 'resident') =>
  trpcServer.use(
    trpcQueries({
      'posts.list': () => ({ nextCursor: null, posts }),
      'resident.me': () => ({ apartment: 42, block: 1, name: 'Алиса', role }),
    }),
    trpcMutation('posts.create', raw => {
      const payload = postCreatePayloadSchema.parse(raw)
      lastCreatePayload = payload
      posts = [...posts, toPost(payload)]
      return { id: payload.id }
    }),
  )

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

const fillValidForm = async (
  user: ReturnType<typeof renderApp>['user'],
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
  firebaseStorage.reset()
  posts = []
  lastCreatePayload = null
})

test('happy-path 8: a Resident publishes an offer with a phone-visibility notice, and it appears under Частные объявления', async () => {
  serve('resident')
  const { currentPath, user } = renderApp('/posts/new')

  expect(
    await screen.findByText(
      'Ваш номер телефона будет виден всем пользователям.',
    ),
  ).toBeInTheDocument()

  await fillValidForm(user, 'Услуги')
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(lastCreatePayload?.kind).toBe('offer')
  expect(await screen.findByText('Продам горный велосипед')).toBeInTheDocument()
  expect(
    await screen.findByText('Объявление опубликовано.'),
  ).toBeInTheDocument()
  expect(feedTab('Частные объявления')).toHaveAttribute('aria-pressed', 'true')
})

test('happy-path 9: a Manager publishes an announcement with no phone notice, and it appears under Уведомления', async () => {
  serve('manager')
  const { currentPath, user } = renderApp('/posts/new')

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
  expect(lastCreatePayload?.kind).toBe('announcement')
  expect(await screen.findByText('Отключение воды')).toBeInTheDocument()
  expect(feedTab('Уведомления')).toHaveAttribute('aria-pressed', 'true')
})

test('validation 1 / edge-cases 12: a title under 3 characters blocks submission; 3 and 80 characters are accepted', async () => {
  serve('resident')
  const { user } = renderApp('/posts/new')

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
  serve('resident')
  const { user } = renderApp('/posts/new')

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
  serve('resident')
  const { user } = renderApp('/posts/new')

  await ready()
  await user.type(titleField(), 'Продам горный велосипед')
  await user.type(descriptionField(), 'Почти новый велосипед, катался месяц')

  expect(submit()).toBeDisabled()
})

test('validation 4: attaching more than 10 files is rejected and no photo is added', async () => {
  serve('resident')
  const { user } = renderApp('/posts/new')

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
  serve('resident')
  const { user } = renderApp('/posts/new')

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
  serve('resident')
  const { user } = renderApp('/posts/new')

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

test('a partially failed upload still publishes the offer and reports the failed photo count', async () => {
  serve('resident')
  firebaseStorage.failUploadsNamed('bad.jpg')
  const { currentPath, user } = renderApp('/posts/new')

  await fillValidForm(user, 'Услуги')
  await user.upload(fileInput(), [makeFile('ok.jpg'), makeFile('bad.jpg')])
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(
    await screen.findByText(
      'Объявление опубликовано. Файлов не загрузилось: 1',
    ),
  ).toBeInTheDocument()
  expect(lastCreatePayload?.media).toHaveLength(1)
})

test('an entirely failed upload still publishes the offer with no media', async () => {
  serve('resident')
  firebaseStorage.failUploadsNamed('bad.jpg')
  const { currentPath, user } = renderApp('/posts/new')

  await fillValidForm(user, 'Услуги')
  await user.upload(fileInput(), makeFile('bad.jpg'))
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(
    await screen.findByText(
      'Объявление опубликовано. Файлов не загрузилось: 1',
    ),
  ).toBeInTheDocument()
  expect(lastCreatePayload?.media).toEqual([])
})

test('validation 11: the save action disables while the mutation is pending, and a second tap does not send a duplicate request', async () => {
  serve('resident')
  let createCalls = 0
  trpcServer.use(
    http.post(`${env.apiUrl}/posts.create`, async () => {
      createCalls += 1
      await delay('infinite')
      return HttpResponse.json([{ result: { data: { id: 'post-x' } } }])
    }),
  )
  const { user } = renderApp('/posts/new')

  await fillValidForm(user, 'Услуги')
  await user.click(submit())

  await waitFor(() => expect(submit()).toBeDisabled())
  await user.click(submit())

  expect(createCalls).toBe(1)
})

test('error-states 3: a lost session during save aborts the create and preserves the entered content for retry', async () => {
  serve('resident')
  const { currentPath, user } = renderApp('/posts/new')

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
  expect(lastCreatePayload).toBeNull()
})

test('error-states 4 / error-states 8: a failed create surfaces the error and preserves the entered title, description, category, and media for retry', async () => {
  serve('resident')
  trpcServer.use(trpcMutationError('posts.create'))
  const { currentPath, user } = renderApp('/posts/new')

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
})
