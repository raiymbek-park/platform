import type { PermissionRole } from '@raiymbek-park/shared/validation-schemas'

import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import { firebaseAuth, renderApp, trpcQueries, trpcServer } from '@/shared/test'

const serveRole = (
  role: PermissionRole,
  extraQueries: Record<string, (input: unknown) => unknown> = {},
) =>
  trpcServer.use(
    trpcQueries({
      'resident.me': () => ({
        apartment: 42,
        block: 1,
        name: 'Алиса',
        role,
      }),
      ...extraQueries,
    }),
  )

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
})

test('validation 8: a Resident opening the create FAB reaches only the offer form', async () => {
  serveRole('resident')
  renderApp('/posts/new')

  expect(await screen.findByText('Новое объявление')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Продам/ })).toBeInTheDocument()
  expect(
    screen.queryByRole('group', { name: 'Тип объявления' }),
  ).not.toBeInTheDocument()
})

test('validation 8: an Owner opening the create FAB reaches only the offer form', async () => {
  serveRole('owner')
  renderApp('/posts/new')

  expect(await screen.findByText('Новое объявление')).toBeInTheDocument()
  expect(
    screen.queryByRole('group', { name: 'Тип объявления' }),
  ).not.toBeInTheDocument()
})

test('validation 8: a Manager opening the create FAB reaches only the announcement form', async () => {
  serveRole('manager')
  renderApp('/posts/new')

  expect(await screen.findByText('Новое уведомление')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Управляющая компания/ }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('group', { name: 'Тип объявления' }),
  ).not.toBeInTheDocument()
})

test('validation 8: Administration opening the create FAB can select either kind', async () => {
  serveRole('administration')
  renderApp('/posts/new')

  expect(
    await screen.findByRole('group', { name: 'Тип объявления' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Частное объявление' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Уведомление' }),
  ).toBeInTheDocument()
})

test('validation 8: a Viewer has no create entry and is redirected away from the create route', async () => {
  serveRole('viewer', { 'posts.list': () => ({ nextCursor: null, posts: [] }) })
  const { currentPath } = renderApp('/posts/new')

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(
    screen.queryByRole('textbox', { name: 'Заголовок' }),
  ).not.toBeInTheDocument()
})
