import { fake, injectFake, resetFirestore } from '@raiymbek-park/api/testing'
import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { firebaseAuth } from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  fake.reset()
  injectFake()
  fake.seed('residents/uid-1', {
    apartment: 42,
    avatarUrl: null,
    block: 1,
    cars: [],
    isPhoneVisible: false,
    name: 'Алиса',
    phone: '+77781234455',
    role: 'administration',
  })
})

afterEach(resetFirestore)

test('happy-path 4: submitting a valid issue runs the real backend — it is stored, listed, and confirmed with a toast', async () => {
  const { currentPath, user } = renderAppWithServer('/issues/new', {
    uid: 'uid-1',
  })

  await screen.findByRole('textbox', { name: 'Тема заявки' })
  await user.click(screen.getByRole('button', { name: /Ремонт/ }))
  await user.type(
    screen.getByRole('textbox', { name: 'Тема заявки' }),
    'Течёт кран на кухне',
  )
  await user.type(
    screen.getByRole('textbox', { name: 'Описание' }),
    'Кран течёт уже неделю, нужен мастер',
  )
  await user.click(screen.getByRole('button', { name: 'Отправить' }))

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  expect(await screen.findByText('Течёт кран на кухне')).toBeInTheDocument()
  expect(await screen.findByText('Заявка отправлена.')).toBeInTheDocument()

  const stored = fake.listDocs('issues')
  expect(stored).toHaveLength(1)
  expect(stored[0]).toMatchObject({
    authorId: 'uid-1',
    number: 1,
    status: 'new',
    title: 'Течёт кран на кухне',
  })
})
