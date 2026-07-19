import type {
  PostCategory,
  PostKind,
} from '@raiymbek-park/shared/validation-schemas'

import { createHash } from 'node:crypto'

import {
  fake,
  injectFake,
  resetFirestore,
  Timestamp,
} from '@raiymbek-park/api/testing'
import { searchPrefixes, tokenize } from '@raiymbek-park/shared'
import { screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { env } from '@/shared/config'
import {
  firebaseAuth,
  intersectionObserver,
  trpcMutationError,
  trpcServer,
} from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

import { useStoreReactions } from '../model/use-store-reactions'

const keywordsOf = (title: string): string[] => [
  ...new Set(tokenize(title).flatMap(searchPrefixes)),
]

const seedResident = (role = 'resident') =>
  fake.seed('residents/uid-1', {
    apartment: 42,
    avatarUrl: null,
    block: 1,
    cars: [],
    isPhoneVisible: false,
    name: 'Alice',
    phone: '+77781234455',
    role,
  })

type Seed = {
  category: PostCategory
  createdAt: number
  kind: PostKind
  media?: string[]
  pinnedUntil?: number
  title: string
}

const seedPost = ({
  category,
  createdAt,
  kind,
  media = [],
  pinnedUntil,
  title,
}: Seed) =>
  fake.seed(`posts/post-${createdAt}`, {
    author: {
      apartment: 12,
      block: 1,
      name: 'George Lucas',
      phone: '+7 747 000 11 22',
    },
    authorId: 'author-uid',
    category,
    commentCount: 0,
    createdAt: Timestamp.fromMillis(createdAt),
    description: 'Description for feed testing.',
    keywords: keywordsOf(title),
    kind,
    lang: 'ru',
    media,
    reactions: {},
    title,
    ...(pinnedUntil ? { pinnedUntil: Timestamp.fromMillis(pinnedUntil) } : {}),
  })

const named: Seed[] = [
  {
    category: 'sell',
    createdAt: 2000,
    kind: 'offer',
    media: ['/photo.jpg'],
    title: 'Selling a mountain bike',
  },
  {
    category: 'services',
    createdAt: 1999,
    kind: 'offer',
    title: 'Shoe repair specialist',
  },
  {
    category: 'management',
    createdAt: 1998,
    kind: 'announcement',
    title: 'New parking rules',
  },
  {
    category: 'city',
    createdAt: 1997,
    kind: 'announcement',
    title: 'Scheduled water shutdown',
  },
]

const filler: Seed[] = Array.from({ length: 20 }, (_, index) => ({
  category: 'other',
  createdAt: 1989 - index,
  kind: 'offer',
  title: `Other post ${index}`,
}))

const garage: Seed = {
  category: 'wanted',
  createdAt: 1900,
  kind: 'offer',
  title: 'Looking for a garage to rent',
}

const seedFeed = (role = 'resident') => {
  seedResident(role)
  ;[...named, ...filler, garage].forEach(seedPost)
}

const hashSource = (...parts: string[]) =>
  createHash('sha256').update(parts.join('\n')).digest('hex').slice(0, 32)

const seedTranslatedPost = () => {
  const title = 'Суды өшіру'
  const description = 'Жоспарлы сумен өшіру 10:00-ден'
  fake.seed('posts/post-translated', {
    author: { apartment: 12, block: 1, name: 'George Lucas' },
    authorId: 'author-uid',
    category: 'city',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(2000),
    description,
    keywords: [],
    kind: 'announcement',
    lang: 'kk',
    media: [],
    reactions: {},
    title,
    translatedRev: hashSource(title, description),
    translations: {
      en: {
        description: 'Scheduled shutdown from 10:00',
        title: 'Water shutdown',
      },
    },
  })
}

const listErrorResponse = (url: URL) => {
  const procedures = (url.pathname.split('/').at(-1) ?? '').split(',')
  return HttpResponse.json(
    procedures.map(() => ({
      error: {
        code: -32603,
        data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 },
        message: 'INTERNAL_SERVER_ERROR',
      },
    })),
    { status: 500 },
  )
}

const breakList = () => {
  const state = { broken: true }
  trpcServer.use(
    http.get(`${env.apiUrl}/*`, ({ request }) => {
      const url = new URL(request.url)
      if (!state.broken || !url.pathname.includes('posts.list'))
        return undefined
      return listErrorResponse(url)
    }),
  )
  return state
}

const countList = () => {
  const state = { count: 0 }
  trpcServer.use(
    http.get(`${env.apiUrl}/*`, ({ request }) => {
      if (new URL(request.url).pathname.includes('posts.list')) state.count += 1
      return undefined
    }),
  )
  return state
}

const search = () => screen.getByTestId('post-search')

const firstButton = (name: string) => {
  const [button] = screen.getAllByRole('button', { name })
  if (!button) throw new Error(`button not found: ${name}`)
  return button
}

const like = () => firstButton('Like')

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
  fake.reset()
  injectFake()
  useStoreReactions.setState({ reactions: {} })
})

afterEach(resetFirestore)

test('happy-path 1: a card shows the title, author meta, and reaction controls', async () => {
  seedFeed()
  renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  const first = within(await firstCard())

  expect(first.getByText('Selling a mountain bike')).toBeInTheDocument()
  expect(first.getAllByText(/George Lucas/).length).toBeGreaterThan(0)
  expect(first.getByRole('button', { name: 'Like' })).toBeInTheDocument()
  expect(first.getByRole('button', { name: 'Dislike' })).toBeInTheDocument()
})

test('happy-path 2: the announcements tab shows only announcements, offers only offers', async () => {
  seedFeed()
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Selling a mountain bike')

  await user.click(feedTab('Notices'))

  expect(await screen.findByText('New parking rules')).toBeInTheDocument()
  await waitFor(() =>
    expect(
      screen.queryByText('Selling a mountain bike'),
    ).not.toBeInTheDocument(),
  )

  await user.click(feedTab('Private ads'))

  expect(await screen.findByText('Selling a mountain bike')).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.queryByText('New parking rules')).not.toBeInTheDocument(),
  )
})

test('happy-path 3: a search finds a post beyond the loaded pages, clearing restores the feed', async () => {
  seedFeed()
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Selling a mountain bike')
  expect(
    screen.queryByText('Looking for a garage to rent'),
  ).not.toBeInTheDocument()

  await user.type(search(), 'garage')

  expect(
    await screen.findByText('Looking for a garage to rent'),
  ).toBeInTheDocument()
  await waitFor(() =>
    expect(
      screen.queryByText('Selling a mountain bike'),
    ).not.toBeInTheDocument(),
  )

  await user.click(screen.getByRole('button', { name: 'Clear search' }))

  expect(await screen.findByText('Selling a mountain bike')).toBeInTheDocument()
})

test('happy-path 4: expanding an offer reveals the author phone for every viewer', async () => {
  seedFeed()
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  const card = await firstCard()

  await user.click(within(card).getByRole('button', { name: /Details/ }))

  expect(within(card).getByText('+7 747 000 11 22')).toBeInTheDocument()
  expect(
    within(card).getByRole('button', { name: /Collapse/ }),
  ).toBeInTheDocument()

  await user.click(within(card).getByRole('button', { name: /Collapse/ }))
  expect(
    within(card).getByRole('button', { name: /Details/ }),
  ).toBeInTheDocument()
})

test('edge-cases 4: an announcement card has no category tag and reads further', async () => {
  seedFeed()
  renderAppWithServer('/posts?tab=announcements', { uid: 'uid-1' })
  const card = await firstCard()

  expect(
    within(card).getByRole('button', { name: /Read more/ }),
  ).toBeInTheDocument()
  expect(within(card).queryByText('For sale')).not.toBeInTheDocument()
})

test('happy-path 5: tapping like records it through the real backend, tapping again removes it', async () => {
  seedFeed()
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Selling a mountain bike')

  await user.click(like())
  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'true'))
  expect(within(like()).getByText('1')).toBeInTheDocument()
  await waitFor(() =>
    expect(fake.getDoc('posts/post-2000')?.reactions).toEqual({
      'uid-1': 'like',
    }),
  )

  await user.click(like())
  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'false'))
  expect(within(like()).getByText('0')).toBeInTheDocument()
  await waitFor(() =>
    expect(fake.getDoc('posts/post-2000')?.reactions).toEqual({}),
  )
})

test('error-states 5: a failed reaction rolls back the optimistic like', async () => {
  seedFeed()
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Selling a mountain bike')
  trpcServer.use(trpcMutationError('posts.react'))

  await user.click(like())

  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'false'))
  expect(within(like()).getByText('0')).toBeInTheDocument()
})

test('happy-path 6: reaching the end of the feed loads the next page', async () => {
  seedFeed()
  renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Selling a mountain bike')
  expect(
    screen.queryByText('Looking for a garage to rent'),
  ).not.toBeInTheDocument()

  intersectionObserver.trigger()

  expect(
    await screen.findByText('Looking for a garage to rent'),
  ).toBeInTheDocument()
})

test('pinned: an active pinnedUntil post stays above newer posts', async () => {
  seedResident()
  named.forEach(seedPost)
  seedPost({
    category: 'other',
    createdAt: 1500,
    kind: 'announcement',
    pinnedUntil: Date.now() + 60 * 60 * 1000,
    title: 'Digital service launch',
  })
  renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })

  await screen.findByText('Digital service launch')
  const card = await firstCard()
  expect(within(card).getByText('Digital service launch')).toBeInTheDocument()
})

test('edge-cases 1: an empty tab shows the empty state once resolved', async () => {
  seedResident()
  filler.forEach(seedPost)
  renderAppWithServer('/posts?tab=announcements', { uid: 'uid-1' })

  expect(await screen.findByTestId('post-empty')).toBeInTheDocument()
})

test('error-states 1: a failed feed shows an error, and retrying recovers it', async () => {
  seedFeed()
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  const list = breakList()

  await screen.findByTestId('post-error', undefined, { timeout: 4000 })
  expect(await screen.findByText('Failed to load the feed')).toBeInTheDocument()

  list.broken = false
  await user.click(screen.getByRole('button', { name: 'Retry' }))

  expect(await screen.findByText('Selling a mountain bike')).toBeInTheDocument()
})

test('validation 8: a Viewer sees no create entry on the feed', async () => {
  seedFeed('viewer')
  renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Selling a mountain bike')

  expect(
    screen.queryByRole('link', { name: 'New post' }),
  ).not.toBeInTheDocument()
})

test('validation 8: a Resident sees the create entry on the feed', async () => {
  seedFeed('resident')
  renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  await screen.findByText('Selling a mountain bike')

  expect(screen.getByRole('link', { name: 'New post' })).toBeInTheDocument()
})

test('happy-path 1 / happy-path 2: the feed shows the localized title, toggles to the original and back with no extra request', async () => {
  seedResident()
  seedTranslatedPost()
  const { user } = renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  const calls = countList()
  const card = await firstCard()

  await within(card).findByText('Water shutdown')

  await user.click(within(card).getByRole('button', { name: /Read more/ }))
  expect(
    within(card).getByRole('button', { name: 'Show original text' }),
  ).toBeInTheDocument()

  await user.click(
    within(card).getByRole('button', { name: 'Show original text' }),
  )
  expect(within(card).getByText('Суды өшіру')).toBeInTheDocument()

  await user.click(
    within(card).getByRole('button', { name: 'Show translation' }),
  )
  expect(within(card).getByText('Water shutdown')).toBeInTheDocument()
  expect(calls.count).toBe(1)
})

test('happy-path 3: a same-locale post shows the original with no translation indicator', async () => {
  seedResident()
  seedPost({
    category: 'city',
    createdAt: 2000,
    kind: 'announcement',
    title: 'Water shutdown',
  })
  renderAppWithServer('/posts?tab=all', { uid: 'uid-1' })
  const card = await firstCard()

  await within(card).findByText('Water shutdown')
  expect(
    screen.queryByRole('button', { name: 'Show original text' }),
  ).not.toBeInTheDocument()
})
