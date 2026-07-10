import type { Issue } from '@raiymbek-park/api'

import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import {
  firebaseAuth,
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

const makeFile = (name: string) => new File(['x'], name, { type: 'image/jpeg' })

const issue: Issue = {
  author: { apartment: 12, block: 1, name: 'Житель' },
  category: 'replacement',
  commentCount: 0,
  createdAt: 1_700_000_000_000,
  description: 'Изношены тросы лифта в первом блоке',
  dislikeCount: 0,
  id: 'issue-115',
  isMine: false,
  isTranslated: false,
  keywords: [],
  likeCount: 0,
  media: [],
  myReaction: null,
  number: 115,
  original: null,
  originalLang: 'ru',
  status: 'in-progress',
  tags: ['warranty'],
  title: 'Замена тросов лифта',
  urgent: false,
}

type ChangePayload = {
  comment: string
  issueId: string
  media: string[]
  status: string
  tags: string[]
}

let lastChange: ChangePayload | null = null
let lastListStatus: string | null = null

const serve = () =>
  trpcServer.use(
    trpcQueries({
      'issues.get': () => issue,
      'issues.list': (raw: unknown) => {
        lastListStatus = (raw as { status?: string })?.status ?? null
        return { issues: [issue], nextCursor: null }
      },
      'resident.me': () => ({
        apartment: 42,
        block: 1,
        name: 'Алиса',
        role: 'manager',
      }),
    }),
    trpcMutation('issues.changeStatus', raw => {
      lastChange = raw as ChangePayload
      return { ...issue }
    }),
  )

const submit = () => screen.getByRole('button', { name: 'Сохранить' })

const ready = () => screen.findByText('Смена статуса')

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  lastChange = null
  lastListStatus = null
})

test('happy-path: the form preselects the current status and existing tags', async () => {
  serve()
  renderApp('/issues/status/issue-115')

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

test('happy-path: changing the status saves, returns to the matching filter, and confirms with a toast', async () => {
  serve()
  const { currentPath, user } = renderApp('/issues/status/issue-115')

  await ready()
  await user.click(screen.getByRole('button', { name: /Выполнено/ }))
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  expect(await screen.findByText('Статус обновлён.')).toBeInTheDocument()
  expect(lastChange).toMatchObject({ issueId: 'issue-115', status: 'done' })
  await waitFor(() => expect(lastListStatus).toBe('done'))
})

test('happy-path: a comment, a tag change, and a photo are included in the payload', async () => {
  serve()
  const { user } = renderApp('/issues/status/issue-115')

  await ready()
  await user.click(screen.getByRole('button', { name: /Дубликат/ }))
  await user.type(
    screen.getByRole('textbox', { name: 'Комментарий' }),
    'Работы выполнены',
  )
  await user.upload(screen.getByLabelText('Добавить'), makeFile('fix.jpg'))
  await user.click(submit())

  await waitFor(() => expect(lastChange).not.toBeNull())
  expect(lastChange?.comment).toBe('Работы выполнены')
  expect(lastChange?.tags).toEqual(
    expect.arrayContaining(['warranty', 'duplicate']),
  )
  expect(lastChange?.media).toHaveLength(1)
})

test('error-states: a failed status change shows an error toast and keeps the form', async () => {
  serve()
  trpcServer.use(trpcMutationError('issues.changeStatus'))
  const { currentPath, user } = renderApp('/issues/status/issue-115')

  await ready()
  await user.click(screen.getByRole('button', { name: /Выполнено/ }))
  await user.click(submit())

  expect(
    await screen.findByText('Не удалось сменить статус. Попробуйте ещё раз.'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/issues/status/issue-115')
})
