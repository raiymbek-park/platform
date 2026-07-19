import type { IssueStatus } from '@raiymbek-park/shared/validation-schemas'

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

import { useStoreDeletedIssues } from '../model/use-store-deleted-issues'
import { useStoreReactions } from '../model/use-store-reactions'
import { useStoreWatches } from '../model/use-store-watches'

const keywordsOf = (title: string, number: number): string[] => [
  ...new Set([...tokenize(title), String(number)].flatMap(searchPrefixes)),
]

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

type IssueSeed = {
  createdAt: number
  id: string
  media?: string[]
  number: number
  status: IssueStatus
  title: string
}

const seedIssue = ({
  createdAt,
  id,
  media = [],
  number,
  status,
  title,
}: IssueSeed) =>
  fake.seed(`issues/${id}`, {
    author: { apartment: 12, block: 1, name: 'Житель' },
    authorId: 'author-uid',
    category: 'other',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(createdAt),
    description: '',
    keywords: keywordsOf(title, number),
    lang: 'ru',
    media,
    number,
    reactions: {},
    status,
    tags: [],
    title,
    urgent: false,
  })

const named: IssueSeed[] = [
  {
    createdAt: 1020,
    id: 'issue-118',
    media: ['/photo.jpg'],
    number: 118,
    status: 'new',
    title: 'Протечка трубы в подвале',
  },
  {
    createdAt: 1019,
    id: 'issue-117',
    number: 117,
    status: 'new',
    title: 'Ночной шум от соседей',
  },
  {
    createdAt: 1018,
    id: 'issue-116',
    number: 116,
    status: 'new',
    title: 'Скамейки во дворе',
  },
  {
    createdAt: 1017,
    id: 'issue-115',
    number: 115,
    status: 'in-progress',
    title: 'Замена тросов лифта в первом блоке',
  },
  {
    createdAt: 1000,
    id: 'issue-113',
    number: 113,
    status: 'blocked',
    title: 'Не работает домофон',
  },
]

const filler: IssueSeed[] = Array.from({ length: 16 }, (_, index) => ({
  createdAt: 1001 + index,
  id: `issue-f${index}`,
  number: 200 + index,
  status: 'new',
  title: `Прочая заявка ${index}`,
}))

const seedIssues = () => {
  seedResident()
  named.forEach(seedIssue)
  filler.forEach(seedIssue)
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
      if (!state.broken || !url.pathname.includes('issues.list'))
        return undefined
      return listErrorResponse(url)
    }),
  )
  return state
}

const gateList = (
  release: Promise<void>,
  shouldGate: (input: string) => boolean = () => true,
) =>
  trpcServer.use(
    http.get(`${env.apiUrl}/*`, async ({ request }) => {
      const url = new URL(request.url)
      const input = url.searchParams.get('input') ?? ''
      if (url.pathname.includes('issues.list') && shouldGate(input))
        await release
      return undefined
    }),
  )

const hashSource = (...parts: string[]) =>
  createHash('sha256').update(parts.join('\n')).digest('hex').slice(0, 32)

const seedTranslatedIssue = () => {
  const title = 'Домофон жұмыс істемейді'
  const description = 'Кіреберістегі домофон кілтпен есікті ашпайды'
  fake.seed('issues/issue-translated', {
    author: { apartment: 12, block: 1, name: 'Житель' },
    authorId: 'author-uid',
    category: 'other',
    commentCount: 0,
    createdAt: Timestamp.fromMillis(2000),
    description,
    keywords: [],
    lang: 'kk',
    media: [],
    number: 200,
    reactions: {},
    status: 'new',
    tags: [],
    title,
    translatedRev: hashSource(title, description),
    translations: {
      ru: {
        description: 'Домофон у подъезда не открывает дверь по ключу',
        title: 'Не работает домофон',
      },
    },
    urgent: false,
  })
}

const search = () => screen.getByTestId('issue-search')

const firstButton = (name: string) => {
  const [button] = screen.getAllByRole('button', { name })
  if (!button) throw new Error(`button not found: ${name}`)
  return button
}

const like = () => firstButton('Нравится')

const dislike = () => firstButton('Не нравится')

const statusTab = (name: string) =>
  within(screen.getByRole('group', { name: 'Фильтр по статусу' })).getByRole(
    'button',
    { name },
  )

const firstIssueCard = async () => {
  const [card] = await screen.findAllByTestId('issue-card')
  if (!card) throw new Error('no card rendered')
  return card
}

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  fake.reset()
  injectFake()
  useStoreReactions.setState({ reactions: {} })
  useStoreWatches.setState({ watches: {} })
  useStoreDeletedIssues.setState({ deletedIds: new Set() })
})

afterEach(resetFirestore)

test('happy-path 12: a search narrows the list to the matching issue, clearing restores it', async () => {
  seedIssues()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Протечка трубы в подвале')

  await user.type(search(), 'лифта')

  expect(
    await screen.findByText('Замена тросов лифта в первом блоке'),
  ).toBeInTheDocument()
  await waitFor(() =>
    expect(
      screen.queryByText('Протечка трубы в подвале'),
    ).not.toBeInTheDocument(),
  )

  await user.click(screen.getByRole('button', { name: 'Очистить поиск' }))

  expect(
    await screen.findByText('Протечка трубы в подвале'),
  ).toBeInTheDocument()
})

test('edge-cases 16: a query under two characters shows the full list, the second character narrows it', async () => {
  seedIssues()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Протечка трубы в подвале')

  await user.type(search(), 'л')

  await waitFor(() =>
    expect(screen.getByText('Протечка трубы в подвале')).toBeInTheDocument(),
  )
  expect(screen.queryByTestId('issue-empty')).not.toBeInTheDocument()

  await user.type(search(), 'ифта')

  expect(
    await screen.findByText('Замена тросов лифта в первом блоке'),
  ).toBeInTheDocument()
  await waitFor(() =>
    expect(
      screen.queryByText('Протечка трубы в подвале'),
    ).not.toBeInTheDocument(),
  )
})

test('happy-path 17: a search shows loading placeholders, not the empty state, until it resolves', async () => {
  seedIssues()
  let release = () => {}
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Протечка трубы в подвале')
  gateList(gate, input => input.includes('домофон'))

  await user.type(search(), 'домофон')

  expect(await screen.findByTestId('issue-skeletons')).toBeInTheDocument()
  expect(screen.queryByTestId('issue-empty')).not.toBeInTheDocument()

  release()

  expect(await screen.findByText('Не работает домофон')).toBeInTheDocument()
})

test('edge-cases 17: a search finds a matching issue that is not among the loaded pages', async () => {
  seedIssues()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Протечка трубы в подвале')
  expect(screen.queryByText('Не работает домофон')).not.toBeInTheDocument()

  await user.type(search(), 'домофон')

  expect(await screen.findByText('Не работает домофон')).toBeInTheDocument()
})

test('validation 20: the search query persists when the status filter changes', async () => {
  seedIssues()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Протечка трубы в подвале')

  await user.type(search(), 'лифта')
  await screen.findByText('Замена тросов лифта в первом блоке')

  await user.click(statusTab('В работе'))

  expect(search()).toHaveValue('лифта')
  expect(
    await screen.findByText('Замена тросов лифта в первом блоке'),
  ).toBeInTheDocument()
})

test('happy-path 8: tapping like records a like through the real backend and increments the count', async () => {
  seedIssues()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Протечка трубы в подвале')

  await user.click(like())

  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'true'))
  expect(within(like()).getByText('1')).toBeInTheDocument()
  await waitFor(() =>
    expect(fake.getDoc('issues/issue-118')?.reactions).toEqual({
      'uid-1': 'like',
    }),
  )
})

test('edge-cases 4: tapping like again removes the like and decrements the count', async () => {
  seedIssues()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Протечка трубы в подвале')

  await user.click(like())
  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'true'))

  await user.click(like())

  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'false'))
  expect(within(like()).getByText('0')).toBeInTheDocument()
})

test('edge-cases 5: tapping dislike after like switches the reaction', async () => {
  seedIssues()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Протечка трубы в подвале')

  await user.click(like())
  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'true'))

  await user.click(dislike())

  await waitFor(() => expect(dislike()).toHaveAttribute('aria-pressed', 'true'))
  expect(like()).toHaveAttribute('aria-pressed', 'false')
  expect(within(dislike()).getByText('1')).toBeInTheDocument()
})

test('error-states 4: a failed reaction rolls back the optimistic like', async () => {
  seedIssues()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Протечка трубы в подвале')
  trpcServer.use(trpcMutationError('issues.react'))

  await user.click(like())

  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'false'))
  expect(within(like()).getByText('0')).toBeInTheDocument()
})

test('happy-path 1: a card shows the issue title, number, and reaction controls', async () => {
  seedIssues()
  renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  const card = await firstIssueCard()
  const first = within(card)

  expect(first.getByText('Протечка трубы в подвале')).toBeInTheDocument()
  expect(first.getByText(/№118/)).toBeInTheDocument()
  expect(first.getByRole('button', { name: 'Нравится' })).toBeInTheDocument()
  expect(first.getByRole('button', { name: 'Не нравится' })).toBeInTheDocument()
})

test('happy-path 2: selecting a status tab shows only issues of that status', async () => {
  seedIssues()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Протечка трубы в подвале')

  await user.click(statusTab('В работе'))

  expect(
    await screen.findByText('Замена тросов лифта в первом блоке'),
  ).toBeInTheDocument()
  await waitFor(() =>
    expect(
      screen.queryByText('Протечка трубы в подвале'),
    ).not.toBeInTheDocument(),
  )
})

test('happy-path 16: the All tab shows issues across statuses', async () => {
  seedIssues()
  const { user } = renderAppWithServer('/issues?status=in-progress', {
    uid: 'uid-1',
  })
  await screen.findByText('Замена тросов лифта в первом блоке')
  expect(screen.queryByText('Протечка трубы в подвале')).not.toBeInTheDocument()

  await user.click(statusTab('Все'))

  expect(
    await screen.findByText('Протечка трубы в подвале'),
  ).toBeInTheDocument()
})

test('happy-path 3: a status with no issues shows the empty state', async () => {
  seedIssues()
  renderAppWithServer('/issues?status=done', { uid: 'uid-1' })

  expect(await screen.findByTestId('issue-empty')).toBeInTheDocument()
})

test('happy-path 14: reaching the end of the list loads the next page', async () => {
  seedIssues()
  renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  await screen.findByText('Протечка трубы в подвале')
  expect(screen.queryByText('Не работает домофон')).not.toBeInTheDocument()

  intersectionObserver.trigger()

  expect(await screen.findByText('Не работает домофон')).toBeInTheDocument()
})

test('happy-path 15: expanding a card with media toggles its expanded state', async () => {
  seedIssues()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  const card = await firstIssueCard()

  expect(card.querySelector('img')).toBeInTheDocument()

  await user.click(within(card).getByRole('button', { name: /Подробнее/ }))
  expect(
    within(card).getByRole('button', { name: /Свернуть/ }),
  ).toBeInTheDocument()

  await user.click(within(card).getByRole('button', { name: /Свернуть/ }))
  expect(
    within(card).getByRole('button', { name: /Подробнее/ }),
  ).toBeInTheDocument()
})

test('error-states 1: a failed list shows an error, and retrying recovers it', async () => {
  seedIssues()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  const list = breakList()

  await screen.findByTestId('issue-error', undefined, { timeout: 4000 })
  expect(
    await screen.findByText('Не удалось загрузить заявки'),
  ).toBeInTheDocument()

  list.broken = false
  await user.click(screen.getByRole('button', { name: 'Повторить' }))

  expect(
    await screen.findByText('Протечка трубы в подвале'),
  ).toBeInTheDocument()
})

test('error-states 9: a slow list keeps skeletons and shows no error before it resolves', async () => {
  seedIssues()
  let release = () => {}
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  gateList(gate, () => true)

  expect(await screen.findByTestId('issue-skeletons')).toBeInTheDocument()
  expect(screen.queryByTestId('issue-error')).not.toBeInTheDocument()

  release()

  expect(
    await screen.findByText('Протечка трубы в подвале'),
  ).toBeInTheDocument()
})

test('happy-path 4: the list shows the localized title, and the expanded detail toggles to the original and back', async () => {
  seedResident()
  seedTranslatedIssue()
  const { user } = renderAppWithServer('/issues?status=all', { uid: 'uid-1' })
  const card = await firstIssueCard()

  await within(card).findByText('Не работает домофон')

  await user.click(within(card).getByRole('button', { name: /Подробнее/ }))

  expect(
    within(card).getByRole('button', { name: 'Показать оригинальный текст' }),
  ).toBeInTheDocument()

  await user.click(
    within(card).getByRole('button', { name: 'Показать оригинальный текст' }),
  )
  expect(within(card).getByText('Домофон жұмыс істемейді')).toBeInTheDocument()

  await user.click(
    within(card).getByRole('button', { name: 'Показать перевод' }),
  )
  expect(within(card).getByText('Не работает домофон')).toBeInTheDocument()
})
