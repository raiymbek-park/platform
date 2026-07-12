import type { Issue } from '@raiymbek-park/api'
import type {
  IssueFilter,
  ReactionKind,
} from '@raiymbek-park/shared/validation-schemas'

import { SEARCH_MIN_CHARS, searchTerms, tokenize } from '@raiymbek-park/shared'
import {
  issueListInputSchema,
  reactionInputSchema,
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
  createdAt: number
  media?: string[]
  number: number
  status: IssueFilter
  title: string
}

const seeds: Seed[] = [
  {
    createdAt: 1018,
    media: ['/photo.jpg'],
    number: 118,
    status: 'new',
    title: 'Протечка трубы в подвале',
  },
  {
    createdAt: 1017,
    number: 117,
    status: 'new',
    title: 'Ночной шум от соседей',
  },
  { createdAt: 1016, number: 116, status: 'new', title: 'Скамейки во дворе' },
  {
    createdAt: 1015,
    number: 115,
    status: 'in-progress',
    title: 'Замена тросов лифта в первом блоке',
  },
  {
    createdAt: 1013,
    number: 113,
    status: 'blocked',
    title: 'Не работает домофон',
  },
]

const prefixesOf = (word: string): string[] =>
  word.length <= SEARCH_MIN_CHARS
    ? [word]
    : Array.from({ length: word.length - SEARCH_MIN_CHARS + 1 }, (_, index) =>
        word.slice(0, SEARCH_MIN_CHARS + index),
      )

const keywordsOf = (title: string, number: number): string[] => [
  ...new Set([...tokenize(title), String(number)].flatMap(prefixesOf)),
]

const toIssue = ({ createdAt, media, number, status, title }: Seed): Issue => ({
  author: { apartment: 12, block: 1, name: 'Житель' },
  category: 'other',
  commentCount: 0,
  createdAt,
  description: '',
  dislikeCount: 0,
  id: `issue-${number}`,
  isMine: false,
  isTranslated: false,
  isWatching: false,
  keywords: keywordsOf(title, number),
  likeCount: 0,
  media: media ?? [],
  myReaction: null,
  number,
  original: null,
  originalLang: 'ru',
  status: status === 'all' ? 'new' : status,
  tags: [],
  title,
  urgent: false,
})

const seedIssues = seeds.map(toIssue)

let issues: Issue[] = seedIssues

const applyReaction = (issue: Issue, kind: ReactionKind): Issue => {
  const next = issue.myReaction === kind ? null : kind
  return {
    ...issue,
    dislikeCount:
      issue.dislikeCount -
      (issue.myReaction === 'dislike' ? 1 : 0) +
      (next === 'dislike' ? 1 : 0),
    likeCount:
      issue.likeCount -
      (issue.myReaction === 'like' ? 1 : 0) +
      (next === 'like' ? 1 : 0),
    myReaction: next,
  }
}

const listPage = (input: {
  cursor?: number
  search?: string
  status: IssueFilter
}) => {
  const scoped =
    input.status === 'all'
      ? issues
      : issues.filter(issue => issue.status === input.status)
  const terms = searchTerms(input.search ?? '')
  const matched = terms.length
    ? scoped.filter(issue => terms.some(term => issue.keywords.includes(term)))
    : scoped
  const ordered = [...matched].sort((a, b) => b.createdAt - a.createdAt)
  const { cursor } = input
  const after =
    cursor === undefined
      ? ordered
      : ordered.filter(issue => issue.createdAt < cursor)
  const page = after.slice(0, PAGE_SIZE)
  const last = page.at(-1)
  const nextCursor = last && page.length === PAGE_SIZE ? last.createdAt : null
  return { issues: page, nextCursor }
}

const serveIssues = (gate?: Promise<void>) =>
  trpcServer.use(
    trpcQueries({
      'issues.list': async (raw: unknown) => {
        const input = issueListInputSchema.parse(raw)
        if (gate && (input.search ?? '').length > 0) await gate
        return listPage(input)
      },
      'resident.me': () => ({
        apartment: 42,
        block: 1,
        name: 'Алиса',
        role: 'resident',
      }),
    }),
    trpcMutation('issues.react', raw => {
      const { issueId, kind } = reactionInputSchema.parse(raw)
      issues = issues.map(issue =>
        issue.id === issueId ? applyReaction(issue, kind) : issue,
      )
      return { ok: true }
    }),
  )

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

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  issues = seedIssues.map(issue => ({ ...issue }))
  useStoreReactions.setState({ reactions: {} })
})

test('happy-path 12: a search narrows the list to the matching issue, clearing restores it', async () => {
  serveIssues()
  const { user } = renderApp('/issues?status=all')
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
  serveIssues()
  const { user } = renderApp('/issues?status=all')
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
  let release = () => {}
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  serveIssues(gate)
  const { user } = renderApp('/issues?status=all')
  await screen.findByText('Протечка трубы в подвале')

  await user.type(search(), 'домофон')

  expect(await screen.findByTestId('issue-skeletons')).toBeInTheDocument()
  expect(screen.queryByTestId('issue-empty')).not.toBeInTheDocument()

  release()

  expect(await screen.findByText('Не работает домофон')).toBeInTheDocument()
})

test('edge-cases 17: a search finds a matching issue that is not among the loaded pages', async () => {
  serveIssues()
  const { user } = renderApp('/issues?status=all')
  await screen.findByText('Протечка трубы в подвале')
  expect(screen.queryByText('Не работает домофон')).not.toBeInTheDocument()

  await user.type(search(), 'домофон')

  expect(await screen.findByText('Не работает домофон')).toBeInTheDocument()
})

test('validation 20: the search query persists when the status filter changes', async () => {
  serveIssues()
  const { user } = renderApp('/issues?status=all')
  await screen.findByText('Протечка трубы в подвале')

  await user.type(search(), 'лифта')
  await screen.findByText('Замена тросов лифта в первом блоке')

  await user.click(statusTab('В работе'))

  expect(search()).toHaveValue('лифта')
  expect(
    await screen.findByText('Замена тросов лифта в первом блоке'),
  ).toBeInTheDocument()
})

test('happy-path 8: tapping like records a like and increments the count', async () => {
  serveIssues()
  const { user } = renderApp('/issues?status=all')
  await screen.findByText('Протечка трубы в подвале')

  await user.click(like())

  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'true'))
  expect(within(like()).getByText('1')).toBeInTheDocument()
})

test('edge-cases 4: tapping like again removes the like and decrements the count', async () => {
  serveIssues()
  const { user } = renderApp('/issues?status=all')
  await screen.findByText('Протечка трубы в подвале')

  await user.click(like())
  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'true'))

  await user.click(like())

  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'false'))
  expect(within(like()).getByText('0')).toBeInTheDocument()
})

test('edge-cases 5: tapping dislike after like switches the reaction', async () => {
  serveIssues()
  const { user } = renderApp('/issues?status=all')
  await screen.findByText('Протечка трубы в подвале')

  await user.click(like())
  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'true'))

  await user.click(dislike())

  await waitFor(() => expect(dislike()).toHaveAttribute('aria-pressed', 'true'))
  expect(like()).toHaveAttribute('aria-pressed', 'false')
  expect(within(dislike()).getByText('1')).toBeInTheDocument()
})

test('error-states 4: a failed reaction rolls back the optimistic like', async () => {
  serveIssues()
  trpcServer.use(trpcMutationError('issues.react'))
  const { user } = renderApp('/issues?status=all')
  await screen.findByText('Протечка трубы в подвале')

  await user.click(like())

  await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'false'))
  expect(within(like()).getByText('0')).toBeInTheDocument()
})

test('happy-path 1: a card shows the issue title, number, and reaction controls', async () => {
  serveIssues()
  renderApp('/issues?status=all')
  const [card] = await screen.findAllByTestId('issue-card')
  if (!card) throw new Error('no card rendered')
  const first = within(card)

  expect(first.getByText('Протечка трубы в подвале')).toBeInTheDocument()
  expect(first.getByText(/№118/)).toBeInTheDocument()
  expect(first.getByRole('button', { name: 'Нравится' })).toBeInTheDocument()
  expect(first.getByRole('button', { name: 'Не нравится' })).toBeInTheDocument()
})

test('happy-path 2: selecting a status tab shows only issues of that status', async () => {
  serveIssues()
  const { user } = renderApp('/issues?status=all')
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
  serveIssues()
  const { user } = renderApp('/issues?status=in-progress')
  await screen.findByText('Замена тросов лифта в первом блоке')
  expect(screen.queryByText('Протечка трубы в подвале')).not.toBeInTheDocument()

  await user.click(statusTab('Все'))

  expect(
    await screen.findByText('Протечка трубы в подвале'),
  ).toBeInTheDocument()
})

test('happy-path 3: a status with no issues shows the empty state', async () => {
  serveIssues()
  renderApp('/issues?status=done')

  expect(await screen.findByTestId('issue-empty')).toBeInTheDocument()
})

test('happy-path 14: reaching the end of the list loads the next page', async () => {
  serveIssues()
  renderApp('/issues?status=all')
  await screen.findByText('Протечка трубы в подвале')
  expect(screen.queryByText('Скамейки во дворе')).not.toBeInTheDocument()

  intersectionObserver.trigger()

  expect(await screen.findByText('Скамейки во дворе')).toBeInTheDocument()
})

test('happy-path 15: expanding a card with media toggles its expanded state', async () => {
  serveIssues()
  const { user } = renderApp('/issues?status=all')
  const [card] = await screen.findAllByTestId('issue-card')
  if (!card) throw new Error('no card rendered')

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
  trpcServer.use(trpcQueriesError())
  const { user } = renderApp('/issues?status=all')
  await screen.findByTestId('issue-error', undefined, { timeout: 4000 })
  expect(
    await screen.findByText('Не удалось загрузить заявки'),
  ).toBeInTheDocument()

  serveIssues()
  await user.click(screen.getByRole('button', { name: 'Повторить' }))

  expect(
    await screen.findByText('Протечка трубы в подвале'),
  ).toBeInTheDocument()
})

test('error-states 9: a slow list keeps skeletons and shows no error before it resolves', async () => {
  let release = () => {}
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  trpcServer.use(
    trpcQueries({
      'issues.list': async (raw: unknown) => {
        await gate
        return listPage(issueListInputSchema.parse(raw))
      },
      'resident.me': () => ({
        apartment: 42,
        block: 1,
        name: 'Алиса',
        role: 'resident',
      }),
    }),
  )
  renderApp('/issues?status=all')

  expect(await screen.findByTestId('issue-skeletons')).toBeInTheDocument()
  expect(screen.queryByTestId('issue-error')).not.toBeInTheDocument()

  release()

  expect(
    await screen.findByText('Протечка трубы в подвале'),
  ).toBeInTheDocument()
})

const translatedIssue = (overrides: Partial<Issue> = {}): Issue => ({
  ...toIssue({
    createdAt: 2000,
    number: 200,
    status: 'new',
    title: 'Домофон жұмыс істемейді',
  }),
  description: 'Кіреберістегі домофон кілтпен есікті ашпайды',
  id: 'issue-translated',
  isTranslated: true,
  original: {
    description: 'Домофон у подъезда не открывает дверь по ключу',
    title: 'Не работает домофон',
  },
  originalLang: 'ru',
  ...overrides,
})

const firstIssueCard = async () => {
  const [card] = await screen.findAllByTestId('issue-card')
  if (!card) throw new Error('no card rendered')
  return card
}

const serveTranslatedIssue = (issue: Issue) =>
  trpcServer.use(
    trpcQueries({
      'issues.list': () => ({ issues: [issue], nextCursor: null }),
      'resident.me': () => ({
        apartment: 42,
        block: 1,
        name: 'Алиса',
        role: 'resident',
      }),
    }),
  )

test('happy-path 4: the list shows the translated title, and the expanded detail shows the indicator with a working toggle', async () => {
  serveTranslatedIssue(translatedIssue())
  const { user } = renderApp('/issues?status=all')
  const card = await firstIssueCard()

  await within(card).findByText('Домофон жұмыс істемейді')

  await user.click(within(card).getByRole('button', { name: /Подробнее/ }))

  expect(
    within(card).getByRole('button', { name: 'Показать оригинальный текст' }),
  ).toBeInTheDocument()

  await user.click(
    within(card).getByRole('button', { name: 'Показать оригинальный текст' }),
  )
  expect(within(card).getByText('Не работает домофон')).toBeInTheDocument()

  await user.click(
    within(card).getByRole('button', { name: 'Показать перевод' }),
  )
  expect(within(card).getByText('Домофон жұмыс істемейді')).toBeInTheDocument()
})
