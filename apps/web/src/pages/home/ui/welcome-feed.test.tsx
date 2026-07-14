import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import { firebaseAuth, renderApp, trpcQueries, trpcServer } from '@/shared/test'

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
})

const serveEvents = (events: unknown[]) =>
  trpcServer.use(
    trpcQueries({
      'events.list': () => events,
      'resident.me': () => ({ apartment: 42, block: 1, name: 'Алиса' }),
      'serviceContacts.list': () => [],
    }),
  )

test('home happy-path 13: a newly opened issue renders as a change row named by its number and title', async () => {
  serveEvents([
    {
      createdAt: 300,
      issueId: 'issue-18',
      number: 18,
      title: 'Протечка воды в подвале',
      type: 'issue',
    },
  ])

  renderApp('/home')

  await waitFor(() =>
    expect(
      screen.getByText('Заявка №18: Протечка воды в подвале'),
    ).toBeInTheDocument(),
  )
})

test('home happy-path 14: the change row shows the title the API projected for the reader’s language', async () => {
  serveEvents([
    {
      createdAt: 300,
      issueId: 'issue-18',
      number: 18,
      title: 'Жертөледегі су ағуы',
      type: 'issue',
    },
  ])

  renderApp('/home')

  await waitFor(() =>
    expect(
      screen.getByText('Заявка №18: Жертөледегі су ағуы'),
    ).toBeInTheDocument(),
  )
  expect(
    screen.queryByText('Заявка №18: Протечка воды в подвале'),
  ).not.toBeInTheDocument()
})
