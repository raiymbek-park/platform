import type { Post } from '@raiymbek-park/api'
import type {
  PermissionRole,
  PostKind,
  PostTab,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'

import { SEARCH_MIN_CHARS, searchTerms, tokenize } from '@raiymbek-park/shared'
import {
  postListInputSchema,
  postReactionInputSchema,
} from '@raiymbek-park/shared/validation-schemas'
import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import {
  firebaseAuth,
  intersectionObserver,
  renderApp,
  trpcMutation,
  trpcMutationError,
  trpcQueries,
  trpcQueriesError,
  trpcServer,
} from '@/shared/test'

import { useStoreReactions } from '../model/use-store-reactions'

const PAGE_SIZE = 2

type Seed = {
  category: Post['category']
  createdAt: number
  isPinned?: boolean
  kind: PostKind
  media?: string[]
  title: string
}

const seeds: Seed[] = [
  {
    category: 'sell',
    createdAt: 1018,
    kind: 'offer',
    media: ['/photo.jpg'],
    title: 'Продам горный велосипед',
  },
  {
    category: 'services',
    createdAt: 1017,
    kind: 'offer',
    title: 'Мастер по ремонту обуви',
  },
  {
    category: 'management',
    createdAt: 1016,
    kind: 'announcement',
    title: 'Новые правила парковки',
  },
  {
    category: 'city',
    createdAt: 1015,
    kind: 'announcement',
    title: 'Плановое отключение воды',
  },
  {
    category: 'wanted',
    createdAt: 1013,
    kind: 'offer',
    title: 'Ищу гараж в аренду',
  },
]

const prefixesOf = (word: string): string[] =>
  word.length <= SEARCH_MIN_CHARS
    ? [word]
    : Array.from({ length: word.length - SEARCH_MIN_CHARS + 1 }, (_, index) =>
        word.slice(0, SEARCH_MIN_CHARS + index),
      )

const keywordsOf = (title: string): string[] => [
  ...new Set(tokenize(title).flatMap(prefixesOf)),
]

const toPost = ({
  category,
  createdAt,
  isPinned,
  kind,
  media,
  title,
}: Seed): Post => ({
  author: {
    apartment: 12,
    block: 1,
    name: 'Житель',
    ...(kind === 'offer' ? { phone: '+7 747 000 11 22' } : {}),
  },
  category,
  commentCount: 0,
  createdAt,
  description: 'Описание для проверки ленты.',
  dislikeCount: 0,
  id: `post-${createdAt}`,
  isMine: false,
  isPinned: isPinned ?? false,
  isTranslated: false,
  keywords: keywordsOf(title),
  kind,
  likeCount: 0,
  media: media ?? [],
  myReaction: null,
  original: null,
  originalLang: 'ru',
  title,
})

const seedPosts = seeds.map(toPost)

let posts: Post[] = seedPosts

const applyReaction = (post: Post, kind: ReactionKind): Post => {
  const next = post.myReaction === kind ? null : kind
  return {
    ...post,
    dislikeCount:
      post.dislikeCount -
      (post.myReaction === 'dislike' ? 1 : 0) +
      (next === 'dislike' ? 1 : 0),
    likeCount:
      post.likeCount -
      (post.myReaction === 'like' ? 1 : 0) +
      (next === 'like' ? 1 : 0),
    myReaction: next,
  }
}

const kindForTab = (tab: PostTab): PostKind | null => {
  if (tab === 'announcements') return 'announcement'
  if (tab === 'offers') return 'offer'
  return null
}

const listPage = (input: {
  cursor?: number
  search?: string
  tab: PostTab
}) => {
  const kind = kindForTab(input.tab)
  const scoped = kind ? posts.filter(post => post.kind === kind) : posts
  const terms = searchTerms(input.search ?? '')
  const matched = terms.length
    ? scoped.filter(post => terms.some(term => post.keywords.includes(term)))
    : scoped
  const ordered = [...matched].sort((a, b) => b.createdAt - a.createdAt)
  const pinned =
    input.cursor === undefined && terms.length === 0
      ? ordered.filter(post => post.isPinned)
      : []
  const pinnedIds = new Set(pinned.map(post => post.id))
  const { cursor } = input
  const after =
    cursor === undefined
      ? ordered
      : ordered.filter(post => post.createdAt < cursor)
  const page = after.slice(0, PAGE_SIZE)
  const last = page.at(-1)
  const nextCursor = last && page.length === PAGE_SIZE ? last.createdAt : null
  return {
    nextCursor,
    posts: [...pinned, ...page.filter(post => !pinnedIds.has(post.id))],
  }
}

const servePosts = (gate?: Promise<void>, role: PermissionRole = 'resident') =>
  trpcServer.use(
    trpcQueries({
      'posts.list': async (raw: unknown) => {
        const input = postListInputSchema.parse(raw)
        if (gate && (input.search ?? '').length > 0) await gate
        return listPage(input)
      },
      'resident.me': () => ({
        apartment: 42,
        block: 1,
        name: 'Алиса',
        role,
      }),
    }),
    trpcMutation('posts.react', raw => {
      const { kind, postId } = postReactionInputSchema.parse(raw)
      posts = posts.map(post =>
        post.id === postId ? applyReaction(post, kind) : post,
      )
      return { ok: true }
    }),
  )

const search = () => screen.getByTestId('post-search')

const firstButton = (name: string) => {
  const [button] = screen.getAllByRole('button', { name })
  if (!button) throw new Error(`button not found: ${name}`)
  return button
}

const like = () => firstButton('Нравится')

const feedTab = (name: string) =>
  within(screen.getByRole('group', { name: 'Фильтр объявлений' })).getByRole(
    'button',
    { name },
  )

const firstCard = async () => {
  const [card] = await screen.findAllByTestId('post-card')
  if (!card) throw new Error('no card rendered')
  return card
}

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  posts = seedPosts.map(post => ({ ...post }))
  useStoreReactions.setState({ reactions: {} })
})

test('happy-path 1: a card shows the title, author meta, and reaction controls', async () => {
  servePosts()
  renderApp('/posts?tab=all')
  const first = within(await firstCard())

  expect(first.getByText('Продам горный велосипед')).toBeInTheDocument()
  expect(first.getAllByText(/Житель/).length).toBeGreaterThan(0)
  expect(first.getByRole('button', { name: 'Нравится' })).toBeInTheDocument()
  expect(first.getByRole('button', { name: 'Не нравится' })).toBeInTheDocument()
})

test('happy-path 2: the announcements tab shows only announcements, offers only offers', async () => {
  servePosts()
  const { user } = renderApp('/posts?tab=all')
  await screen.findByText('Продам горный велосипед')

  await user.click(feedTab('Уведомления'))

  expect(await screen.findByText('Новые правила парковки')).toBeInTheDocument()
  await waitFor(() =>
    expect(
      screen.queryByText('Продам горный велосипед'),
    ).not.toBeInTheDocument(),
  )

  await user.click(feedTab('Частные объявления'))

  expect(await screen.findByText('Продам горный велосипед')).toBeInTheDocument()
  await waitFor(() =>
    expect(
      screen.queryByText('Новые правила парковки'),
    ).not.toBeInTheDocument(),
  )
})

test('happy-path 3: a search finds a post beyond the loaded pages, clearing restores the feed', async () => {
  servePosts()
  const { user } = renderApp('/posts?tab=all')
  await screen.findByText('Продам горный велосипед')
  expect(screen.queryByText('Ищу гараж в аренду')).not.toBeInTheDocument()

  await user.type(search(), 'гараж')

  expect(await screen.findByText('Ищу гараж в аренду')).toBeInTheDocument()
  await waitFor(() =>
    expect(
      screen.queryByText('Продам горный велосипед'),
    ).not.toBeInTheDocument(),
  )

  await user.click(screen.getByRole('button', { name: 'Очистить поиск' }))

  expect(await screen.findByText('Продам горный велосипед')).toBeInTheDocument()
})

test('happy-path 4: expanding an offer reveals the author phone for every viewer', async () => {
  servePosts()
  const { user } = renderApp('/posts?tab=all')
  const card = await firstCard()

  await user.click(within(card).getByRole('button', { name: /Подробнее/ }))

  expect(within(card).getByText('+7 747 000 11 22')).toBeInTheDocument()
  expect(
    within(card).getByRole('button', { name: /Свернуть/ }),
  ).toBeInTheDocument()

  await user.click(within(card).getByRole('button', { name: /Свернуть/ }))
  expect(
    within(card).getByRole('button', { name: /Подробнее/ }),
  ).toBeInTheDocument()
})

test('edge-cases 4: an announcement card has no category tag and reads further', async () => {
  servePosts()
  renderApp('/posts?tab=announcements')
  const card = await firstCard()

  expect(
    within(card).getByRole('button', { name: /Читать далее/ }),
  ).toBeInTheDocument()
  expect(within(card).queryByText('Продам')).not.toBeInTheDocument()
})

test('happy-path 5: tapping like records it optimistically, tapping again removes it', async () => {
  servePosts()
  const { user } = renderApp('/posts?tab=all')
  await screen.findByText('Продам горный велосипед')

  await user.click(like())
  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'true'))
  expect(within(like()).getByText('1')).toBeInTheDocument()

  await user.click(like())
  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'false'))
  expect(within(like()).getByText('0')).toBeInTheDocument()
})

test('error-states 5: a failed reaction rolls back the optimistic like', async () => {
  servePosts()
  trpcServer.use(trpcMutationError('posts.react'))
  const { user } = renderApp('/posts?tab=all')
  await screen.findByText('Продам горный велосипед')

  await user.click(like())

  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'false'))
  expect(within(like()).getByText('0')).toBeInTheDocument()
})

test('happy-path 6: reaching the end of the feed loads the next page', async () => {
  servePosts()
  renderApp('/posts?tab=all')
  await screen.findByText('Продам горный велосипед')
  expect(screen.queryByText('Новые правила парковки')).not.toBeInTheDocument()

  intersectionObserver.trigger()

  expect(await screen.findByText('Новые правила парковки')).toBeInTheDocument()
})

test('pinned: an active pinnedUntil post stays above newer posts', async () => {
  posts = [
    ...seedPosts.map(post => ({ ...post })),
    toPost({
      category: 'other',
      createdAt: 1001,
      isPinned: true,
      kind: 'announcement',
      title: 'Запуск цифрового сервиса',
    }),
  ]
  servePosts()
  renderApp('/posts?tab=all')

  await screen.findByText('Запуск цифрового сервиса')
  const [first] = screen.getAllByTestId('post-card')
  if (!first) throw new Error('no card rendered')
  expect(
    within(first).getByText('Запуск цифрового сервиса'),
  ).toBeInTheDocument()
})

test('edge-cases 1: an empty tab shows the empty state once resolved', async () => {
  posts = seedPosts.filter(post => post.kind === 'offer')
  servePosts()
  renderApp('/posts?tab=announcements')

  expect(await screen.findByTestId('post-empty')).toBeInTheDocument()
})

test('error-states 1: a failed feed shows an error, and retrying recovers it', async () => {
  trpcServer.use(trpcQueriesError())
  const { user } = renderApp('/posts?tab=all')
  await screen.findByTestId('post-error', undefined, { timeout: 4000 })
  expect(
    await screen.findByText('Не удалось загрузить ленту'),
  ).toBeInTheDocument()

  servePosts()
  await user.click(screen.getByRole('button', { name: 'Повторить' }))

  expect(await screen.findByText('Продам горный велосипед')).toBeInTheDocument()
})

test('validation 8: a Viewer sees no create entry on the feed', async () => {
  servePosts(undefined, 'viewer')
  renderApp('/posts?tab=all')
  await screen.findByText('Продам горный велосипед')

  expect(
    screen.queryByRole('link', { name: 'Новое объявление' }),
  ).not.toBeInTheDocument()
})

test('validation 8: a Resident sees the create entry on the feed', async () => {
  servePosts()
  renderApp('/posts?tab=all')
  await screen.findByText('Продам горный велосипед')

  expect(
    screen.getByRole('link', { name: 'Новое объявление' }),
  ).toBeInTheDocument()
})

const translatedPost = (overrides: Partial<Post> = {}): Post => ({
  ...toPost({
    category: 'city',
    createdAt: 2000,
    kind: 'announcement',
    title: 'Суды өшіру',
  }),
  description: 'Жоспарлы сумен өшіру 10:00-ден',
  id: 'post-translated',
  isTranslated: true,
  original: {
    description: 'Плановое отключение с 10:00',
    title: 'Отключение воды',
  },
  originalLang: 'ru',
  ...overrides,
})

let listCallCount = 0

const serveTranslated = (post: Post) => {
  listCallCount = 0
  trpcServer.use(
    trpcQueries({
      'posts.list': () => {
        listCallCount += 1
        return { nextCursor: null, posts: [post] }
      },
      'resident.me': () => ({
        apartment: 42,
        block: 1,
        name: 'Алиса',
        role: 'resident',
      }),
    }),
  )
}

test('happy-path 1 / edge-cases 6: the feed shows the translated title for a Kazakh-locale viewer', async () => {
  serveTranslated(translatedPost())
  renderApp('/posts?tab=all')

  expect(await screen.findByText('Суды өшіру')).toBeInTheDocument()
})

test('happy-path 2: the expanded card shows the indicator, toggles to the original and back with no extra request', async () => {
  serveTranslated(translatedPost())
  const { user } = renderApp('/posts?tab=all')
  const card = await firstCard()

  await user.click(within(card).getByRole('button', { name: /Читать далее/ }))

  expect(
    within(card).getByRole('button', { name: 'Показать оригинальный текст' }),
  ).toBeInTheDocument()
  expect(within(card).getByText('Суды өшіру')).toBeInTheDocument()

  await user.click(
    within(card).getByRole('button', { name: 'Показать оригинальный текст' }),
  )
  expect(within(card).getByText('Отключение воды')).toBeInTheDocument()

  await user.click(
    within(card).getByRole('button', { name: 'Показать перевод' }),
  )
  expect(within(card).getByText('Суды өшіру')).toBeInTheDocument()
  expect(listCallCount).toBe(1)
})

test('happy-path 3: a same-locale post shows the original with no translation indicator', async () => {
  serveTranslated(
    translatedPost({
      description: 'Описание для проверки ленты.',
      isTranslated: false,
      original: null,
      originalLang: 'ru',
      title: 'Отключение воды',
    }),
  )
  renderApp('/posts?tab=all')
  const card = await firstCard()

  await within(card).findByText('Отключение воды')
  expect(
    screen.queryByRole('button', { name: 'Показать оригинальный текст' }),
  ).not.toBeInTheDocument()
})

test('edge-cases 3: a translated post exposes the show-original toggle regardless of the source language', async () => {
  serveTranslated(translatedPost({ originalLang: 'kk' }))
  const { user } = renderApp('/posts?tab=all')
  const card = await firstCard()

  await user.click(within(card).getByRole('button', { name: /Читать далее/ }))

  expect(
    within(card).getByRole('button', { name: 'Показать оригинальный текст' }),
  ).toBeInTheDocument()
})
