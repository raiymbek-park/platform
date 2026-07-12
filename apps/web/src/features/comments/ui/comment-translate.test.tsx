import type { Comment } from '@raiymbek-park/api'

import { screen, waitFor } from '@testing-library/react'
import { delay, HttpResponse, http } from 'msw'
import { beforeEach, expect, test } from 'vitest'

import { env } from '@/shared/config'
import {
  firebaseAuth,
  renderApp,
  trpcMutation,
  trpcMutationError,
  trpcQueries,
  trpcServer,
} from '@/shared/test'

const seedComment = (overrides: Partial<Comment> = {}): Comment => ({
  author: { apartment: 12, avatarUrl: null, block: 1, name: 'Тимур Ким' },
  createdAt: 1_700_000_000_000,
  editedAt: null,
  id: 'comment-1',
  isMine: false,
  lang: 'ru',
  media: [],
  text: 'Отличное предложение',
  translation: null,
  ...overrides,
})

const post = () => ({
  author: { apartment: 42, block: 1, name: 'Алиса', phone: '+7 700 000 00 00' },
  category: 'sell' as const,
  commentCount: 1,
  createdAt: 1000,
  description: 'Описание объявления для проверки треда комментариев.',
  dislikeCount: 0,
  id: 'post-1',
  isMine: false,
  isPinned: false,
  keywords: [],
  kind: 'offer' as const,
  likeCount: 0,
  media: [],
  myReaction: null,
  title: 'Продам горный велосипед',
})

let postComments: Comment[] = []

const serve = () =>
  trpcServer.use(
    trpcQueries({
      'comments.list': () => ({ comments: postComments, nextCursor: null }),
      'posts.get': () => post(),
      'posts.list': () => ({ nextCursor: null, posts: [post()] }),
      'resident.me': () => ({
        apartment: 42,
        block: 1,
        name: 'Алиса',
        role: 'resident',
      }),
    }),
  )

const translateButton = () =>
  screen.getByRole('button', { name: /Перевести|Переводим|Показать оригинал/ })

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  postComments = []
})

test('happy-path 5: tapping Translate shows the response in the viewer’s locale and becomes a show-original toggle', async () => {
  postComments = [seedComment({ lang: 'en', text: 'Great offer' })]
  serve()
  trpcServer.use(
    trpcMutation('comments.translate', () => ({
      lang: 'en',
      text: 'Отличное предложение',
    })),
  )
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByText('Great offer')

  await user.click(translateButton())

  expect(await screen.findByText('Отличное предложение')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Показать оригинал' }),
  ).toBeInTheDocument()
})

test('happy-path 6: a cached translation is shown with no new translation call', async () => {
  postComments = [
    seedComment({
      lang: 'en',
      text: 'Great offer',
      translation: 'Отличное предложение',
    }),
  ]
  serve()
  let translateCalls = 0
  trpcServer.use(
    trpcMutation('comments.translate', () => {
      translateCalls += 1
      return { lang: 'en', text: 'Отличное предложение' }
    }),
  )
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByText('Great offer')

  await user.click(translateButton())

  expect(await screen.findByText('Отличное предложение')).toBeInTheDocument()
  expect(translateCalls).toBe(0)
})

test('edge-cases 4: a translate correcting the recorded source language to the viewer’s own locale removes the action', async () => {
  postComments = [seedComment({ lang: 'kk', text: 'Привет, ещё актуально?' })]
  serve()
  trpcServer.use(
    trpcMutation('comments.translate', () => ({
      lang: 'ru',
      text: 'Привет, ещё актуально?',
    })),
  )
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByText('Привет, ещё актуально?')

  await user.click(translateButton())
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: /Перевести|Показать оригинал/ }),
    ).not.toBeInTheDocument(),
  )
  expect(screen.getByText('Привет, ещё актуально?')).toBeInTheDocument()
})

test('edge-cases 5: a comment already in the viewer’s own language shows no Translate action', async () => {
  postComments = [seedComment({ lang: 'ru', text: 'Уже по-русски' })]
  serve()
  renderApp('/posts/post-1/comments')
  await screen.findByText('Уже по-русски')

  expect(
    screen.queryByRole('button', { name: /Перевести/ }),
  ).not.toBeInTheDocument()
})

test('error-states 2: a failed translation shows a localized error, keeps the original text, and leaves the action available for retry', async () => {
  postComments = [seedComment({ lang: 'en', text: 'Great offer' })]
  serve()
  trpcServer.use(trpcMutationError('comments.translate'))
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByText('Great offer')

  await user.click(translateButton())

  expect(
    await screen.findByText(
      'Не удалось перевести сообщение. Попробуйте ещё раз.',
    ),
  ).toBeInTheDocument()
  expect(screen.getByText('Great offer')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Перевести' })).toBeInTheDocument()
})

test('error-states 4: the action shows a loading state while the response is in flight', async () => {
  postComments = [seedComment({ lang: 'en', text: 'Great offer' })]
  serve()
  trpcServer.use(
    http.post(`${env.apiUrl}/comments.translate`, async () => {
      await delay('infinite')
      return HttpResponse.json([{ result: { data: { ok: true } } }])
    }),
  )
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByText('Great offer')

  await user.click(translateButton())

  expect(
    await screen.findByRole('button', { name: 'Переводим…' }),
  ).toBeDisabled()
})

test('validation 1: a repeated tap while the request is in flight sends no duplicate request', async () => {
  postComments = [seedComment({ lang: 'en', text: 'Great offer' })]
  serve()
  let translateCalls = 0
  trpcServer.use(
    http.post(`${env.apiUrl}/comments.translate`, async () => {
      translateCalls += 1
      await delay('infinite')
      return HttpResponse.json([{ result: { data: { ok: true } } }])
    }),
  )
  const { user } = renderApp('/posts/post-1/comments')
  await screen.findByText('Great offer')

  await user.click(translateButton())
  await waitFor(() => expect(translateButton()).toBeDisabled())
  await user.click(translateButton())

  expect(translateCalls).toBe(1)
})
