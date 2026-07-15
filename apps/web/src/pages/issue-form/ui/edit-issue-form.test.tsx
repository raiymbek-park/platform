import type { Issue } from '@raiymbek-park/api'

import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import {
  firebaseAuth,
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

const issue: Issue = {
  author: { apartment: 42, block: 1, name: 'Алиса' },
  category: 'repair',
  commentCount: 0,
  createdAt: 1_700_000_000_000,
  description: 'Кран на кухне течёт уже неделю, нужен мастер',
  dislikeCount: 0,
  id: 'issue-1',
  isMine: true,
  isTranslated: false,
  isWatching: false,
  keywords: [],
  likeCount: 0,
  media: [],
  myReaction: null,
  number: 42,
  original: null,
  originalLang: 'ru',
  status: 'new',
  tags: [],
  title: 'Течёт кран на кухне',
  urgent: false,
}

type UpdatePayload = {
  category: string
  description: string
  id: string
  media: string[]
  title: string
  urgent: boolean
}

let lastUpdate: UpdatePayload | null = null

const serve = () =>
  trpcServer.use(
    trpcQueries({
      'issues.get': () => issue,
      'issues.list': () => ({ issues: [issue], nextCursor: null }),
      'resident.me': () => residentMe(),
    }),
    trpcMutation('issues.update', raw => {
      lastUpdate = raw as UpdatePayload
      return { ...issue, ...(raw as object) }
    }),
  )

const titleField = () => screen.getByRole('textbox', { name: 'Тема заявки' })

const descriptionField = () => screen.getByRole('textbox', { name: 'Описание' })

const submit = () => screen.getByRole('button', { name: 'Сохранить' })

const ready = () => screen.findByRole('textbox', { name: 'Тема заявки' })

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  lastUpdate = null
})

test('happy-path: the edit form is prefilled with the current issue values', async () => {
  serve()
  renderApp('/issues/edit/issue-1')

  await ready()
  expect(titleField()).toHaveValue('Течёт кран на кухне')
  expect(descriptionField()).toHaveValue(
    'Кран на кухне течёт уже неделю, нужен мастер',
  )
  expect(screen.getByRole('button', { name: /Ремонт/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('happy-path: editing the title and saving calls update and returns to the list with a toast', async () => {
  serve()
  const { currentPath, user } = renderApp('/issues/edit/issue-1')

  await ready()
  await user.clear(titleField())
  await user.type(titleField(), 'Течёт кран в ванной')
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  expect(await screen.findByText('Изменения сохранены.')).toBeInTheDocument()
  expect(lastUpdate?.id).toBe('issue-1')
  expect(lastUpdate?.title).toBe('Течёт кран в ванной')
})

test('validation: clearing the title below three characters disables save', async () => {
  serve()
  const { user } = renderApp('/issues/edit/issue-1')

  await ready()
  await user.clear(titleField())
  await user.type(titleField(), 'ав')

  expect(submit()).toBeDisabled()
})

test('error-states: a failed update shows an error toast and keeps the form', async () => {
  serve()
  trpcServer.use(trpcMutationError('issues.update'))
  const { currentPath, user } = renderApp('/issues/edit/issue-1')

  await ready()
  await user.clear(titleField())
  await user.type(titleField(), 'Течёт кран в ванной')
  await user.click(submit())

  expect(
    await screen.findByText(
      'Не удалось сохранить изменения. Попробуйте ещё раз.',
    ),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/issues/edit/issue-1')
  expect(titleField()).toHaveValue('Течёт кран в ванной')
})
