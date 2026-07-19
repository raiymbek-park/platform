import type { PermissionRole } from '@raiymbek-park/shared/validation-schemas'

import { fake, injectFake, resetFirestore } from '@raiymbek-park/api/testing'
import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { firebaseAuth } from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

const seedResident = (role: PermissionRole) =>
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

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  fake.reset()
  injectFake()
})

afterEach(resetFirestore)

test('validation 8: a Resident opening the create FAB reaches only the offer form', async () => {
  seedResident('resident')
  renderAppWithServer('/posts/new', { uid: 'uid-1' })

  expect(await screen.findByText('New post')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /For sale/ })).toBeInTheDocument()
  expect(
    screen.queryByRole('group', { name: 'Post type' }),
  ).not.toBeInTheDocument()
})

test('validation 8: an Owner opening the create FAB reaches only the offer form', async () => {
  seedResident('owner')
  renderAppWithServer('/posts/new', { uid: 'uid-1' })

  expect(await screen.findByText('New post')).toBeInTheDocument()
  expect(
    screen.queryByRole('group', { name: 'Post type' }),
  ).not.toBeInTheDocument()
})

test('validation 8: a Manager opening the create FAB reaches only the announcement form', async () => {
  seedResident('manager')
  renderAppWithServer('/posts/new', { uid: 'uid-1' })

  expect(await screen.findByText('New notice')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Management company/ }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('group', { name: 'Post type' }),
  ).not.toBeInTheDocument()
})

test('validation 8: Administration opening the create FAB can select either kind', async () => {
  seedResident('administration')
  renderAppWithServer('/posts/new', { uid: 'uid-1' })

  expect(
    await screen.findByRole('group', { name: 'Post type' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Private ad' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Notice' })).toBeInTheDocument()
})

test('validation 8: a Viewer has no create entry and is redirected away from the create route', async () => {
  seedResident('viewer')
  const { currentPath } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(
    screen.queryByRole('textbox', { name: 'Title' }),
  ).not.toBeInTheDocument()
})
