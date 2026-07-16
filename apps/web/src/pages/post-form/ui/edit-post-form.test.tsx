import type { Post } from '@raiymbek-park/api'
import type { PostUpdateInput } from '@raiymbek-park/shared/validation-schemas'

import { postUpdateInputSchema } from '@raiymbek-park/shared/validation-schemas'
import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import {
  firebaseAuth,
  firebaseStorage,
  renderApp,
  residentMe,
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

const makeFile = (name: string) => new File([], name, { type: 'image/jpeg' })

const seedPost: Post = {
  author: {
    apartment: 12,
    block: 3,
    name: 'Алиса',
    phone: '+7 700 000 00 00',
  },
  category: 'sell',
  commentCount: 0,
  createdAt: 1_700_000_000_000,
  description: 'Продаю велосипед в отличном состоянии, почти не использовался',
  dislikeCount: 0,
  id: 'post-1',
  isMine: true,
  isPinned: false,
  isTranslated: false,
  keywords: [],
  kind: 'offer',
  likeCount: 0,
  media: [],
  myReaction: null,
  original: null,
  originalLang: 'ru',
  title: 'Продам горный велосипед',
}

let currentPost: Post = { ...seedPost }
let lastUpdate: PostUpdateInput | null = null

const serve = () =>
  trpcServer.use(
    trpcQueries({
      'posts.get': () => currentPost,
      'posts.list': () => ({ nextCursor: null, posts: [currentPost] }),
      'resident.me': () => residentMe(),
    }),
    trpcMutation('posts.update', raw => {
      const input = postUpdateInputSchema.parse(raw)
      lastUpdate = input
      currentPost = {
        ...currentPost,
        category: input.category,
        description: input.description,
        media: input.media,
        title: input.title,
      }
      return { ok: true }
    }),
  )

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
  currentPost = { ...seedPost }
  lastUpdate = null
})

test('happy-path 10: opening edit pre-fills the offer form with the post’s current values', async () => {
  serve()
  renderApp('/posts/edit/post-1')

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
  serve()
  renderApp('/posts/edit/post-1')

  await ready()
  expect(
    screen.queryByRole('group', { name: 'Тип объявления' }),
  ).not.toBeInTheDocument()
})

test('happy-path 10a: saving an edited field reflects the change in the feed and keeps the kind unchanged', async () => {
  serve()
  const { currentPath, user } = renderApp('/posts/edit/post-1')

  await ready()
  await user.clear(titleField())
  await user.type(titleField(), 'Продам городской велосипед')
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(
    await screen.findByText('Продам городской велосипед'),
  ).toBeInTheDocument()
  expect(await screen.findByText('Изменения сохранены.')).toBeInTheDocument()
  expect(lastUpdate?.kind).toBe('offer')
  expect(feedTab('Частные объявления')).toHaveAttribute('aria-pressed', 'true')
})

test('a partially failed re-upload still saves the edit and reports the failed photo count', async () => {
  serve()
  firebaseStorage.failUploadsNamed('bad.jpg')
  const { currentPath, user } = renderApp('/posts/edit/post-1')

  await ready()
  await user.upload(fileInput(), [makeFile('ok.jpg'), makeFile('bad.jpg')])
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(
    await screen.findByText('Изменения сохранены. Файлов не загрузилось: 1'),
  ).toBeInTheDocument()
  expect(lastUpdate?.media).toHaveLength(1)
})

test('error-states: a NOT_FOUND update error redirects to the feed with a not-found toast', async () => {
  serve()
  trpcServer.use(trpcMutationError('posts.update', 'NOT_FOUND', 404))
  const { currentPath, user } = renderApp('/posts/edit/post-1')

  await ready()
  await user.clear(titleField())
  await user.type(titleField(), 'Продам городской велосипед')
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(await screen.findByText('Объявление не найдено.')).toBeInTheDocument()
})

test('error-states 4: a failed edit shows an error toast and preserves the form input for retry', async () => {
  serve()
  trpcServer.use(trpcMutationError('posts.update'))
  const { currentPath, user } = renderApp('/posts/edit/post-1')

  await ready()
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
})
