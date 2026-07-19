import { fake, injectFake, resetFirestore } from '@raiymbek-park/api/testing'
import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'

import {
  firebaseAuth,
  firebaseStorage,
  trpcMutationError,
  trpcServer,
} from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

if (!URL.createObjectURL)
  Object.assign(URL, {
    createObjectURL: () => 'blob:x',
    revokeObjectURL: () => {},
  })

const makeFile = (
  name: string,
  { size, type = 'image/jpeg' }: { size?: number; type?: string } = {},
) => {
  const file = new File(['x'], name, { type })
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size })
  return file
}

const submit = () => screen.getByRole('button', { name: 'Submit' })

const selectCategory = () => screen.getByRole('button', { name: /Repair/ })

const titleField = () => screen.getByRole('textbox', { name: 'Issue title' })

const descriptionField = () =>
  screen.getByRole('textbox', { name: 'Description' })

const fileInput = () => screen.getByLabelText('Add')

const ready = () => screen.findByRole('textbox', { name: 'Issue title' })

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

const fillValidForm = async (
  user: ReturnType<typeof renderAppWithServer>['user'],
  {
    title = "Kitchen tap won't stop dripping",
    description = 'The tap has been dripping for a week, need a plumber',
  } = {},
) => {
  await ready()
  await user.click(selectCategory())
  await user.type(titleField(), title)
  await user.type(descriptionField(), description)
}

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  fake.reset()
  injectFake()
})

afterEach(resetFirestore)

test('happy-path 4: submitting a valid issue lists it with a server-assigned number and a confirmation toast', async () => {
  seedResident()
  const { currentPath, user } = renderAppWithServer('/issues/new', {
    uid: 'uid-1',
  })

  await fillValidForm(user)
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  expect(
    await screen.findByText("Kitchen tap won't stop dripping"),
  ).toBeInTheDocument()
  expect(await screen.findByText('Issue submitted.')).toBeInTheDocument()

  const stored = fake.listDocs('issues')
  expect(stored).toHaveLength(1)
  expect(stored[0]).toMatchObject({
    author: { apartment: 42, block: 1, name: 'Alice' },
    authorId: 'uid-1',
    number: 1,
    status: 'new',
    title: "Kitchen tap won't stop dripping",
    urgent: false,
  })
})

test('happy-path 5: marking urgent and attaching a photo stores urgent true with the uploaded media', async () => {
  seedResident()
  const { currentPath, user } = renderAppWithServer('/issues/new', {
    uid: 'uid-1',
  })

  await fillValidForm(user)
  await user.click(screen.getByRole('button', { name: /Urgent/ }))
  await user.upload(fileInput(), makeFile('photo.jpg'))
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  await screen.findByText('Issue submitted.')

  const stored = fake.listDocs('issues')
  expect(stored).toHaveLength(1)
  expect(stored[0]?.urgent).toBe(true)
  expect(stored[0]?.media).toHaveLength(1)
})

test('validation 1: no category selected keeps the submit button disabled', async () => {
  seedResident()
  const { user } = renderAppWithServer('/issues/new', { uid: 'uid-1' })

  await ready()
  await user.type(titleField(), "Kitchen tap won't stop dripping")
  await user.type(
    descriptionField(),
    'The tap has been dripping for a week, need a plumber',
  )

  expect(submit()).toBeDisabled()
})

test('validation 2 / edge-cases 1: a title under 3 characters blocks submit, 3 and 80 characters are accepted', async () => {
  seedResident()
  const { user } = renderAppWithServer('/issues/new', { uid: 'uid-1' })

  await ready()
  await user.click(selectCategory())
  await user.type(
    descriptionField(),
    'The tap has been dripping for a week, need a plumber',
  )

  await user.type(titleField(), 'ab')
  expect(submit()).toBeDisabled()

  await user.clear(titleField())
  await user.click(titleField())
  await user.paste('a'.repeat(3))
  await waitFor(() => expect(submit()).toBeEnabled())

  await user.clear(titleField())
  await user.click(titleField())
  await user.paste('a'.repeat(80))
  await waitFor(() => expect(submit()).toBeEnabled())
})

test('validation 3 / edge-cases 2: a description under 10 characters blocks submit, 10 and 1000 characters are accepted', async () => {
  seedResident()
  const { user } = renderAppWithServer('/issues/new', { uid: 'uid-1' })

  await ready()
  await user.click(selectCategory())
  await user.type(titleField(), "Kitchen tap won't stop dripping")

  await user.type(descriptionField(), 'a'.repeat(9))
  expect(submit()).toBeDisabled()

  await user.clear(descriptionField())
  await user.click(descriptionField())
  await user.paste('a'.repeat(10))
  await waitFor(() => expect(submit()).toBeEnabled())

  await user.clear(descriptionField())
  await user.click(descriptionField())
  await user.paste('a'.repeat(1000))
  await waitFor(() => expect(submit()).toBeEnabled())
})

test('edge-cases 3: a whitespace-only title is treated as empty and blocks submit', async () => {
  seedResident()
  const { user } = renderAppWithServer('/issues/new', { uid: 'uid-1' })

  await ready()
  await user.click(selectCategory())
  await user.type(titleField(), '   ')
  await user.type(
    descriptionField(),
    'The tap has been dripping for a week, need a plumber',
  )

  expect(submit()).toBeDisabled()
})

test('validation 5 / edge-cases 14: attaching more than 10 files is rejected with a toast and no photo is added', async () => {
  seedResident()
  const { user } = renderAppWithServer('/issues/new', { uid: 'uid-1' })

  await ready()
  const files = Array.from({ length: 11 }, (_, index) =>
    makeFile(`photo-${index}.jpg`),
  )
  await user.upload(fileInput(), files)

  expect(
    await screen.findByText('You can attach at most 10 files'),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Delete' }),
  ).not.toBeInTheDocument()
})

test('validation 5 / edge-cases 14: attaching a file over 200 MB is rejected with a toast and no photo is added', async () => {
  seedResident()
  const { user } = renderAppWithServer('/issues/new', { uid: 'uid-1' })

  await ready()
  const big = makeFile('big.mp4', {
    size: 200 * 1024 * 1024 + 1,
    type: 'video/mp4',
  })
  await user.upload(fileInput(), big)

  expect(
    await screen.findByText(
      'File too large: the total size of attachments must not exceed 200 MB',
    ),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Delete' }),
  ).not.toBeInTheDocument()
})

test('edge-cases 14: attaching exactly 10 files is accepted and adds the photos', async () => {
  seedResident()
  const { user } = renderAppWithServer('/issues/new', { uid: 'uid-1' })

  await ready()
  const files = Array.from({ length: 10 }, (_, index) =>
    makeFile(`photo-${index}.jpg`),
  )
  await user.upload(fileInput(), files)

  expect(
    await screen.findByRole('button', { name: 'Delete' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByText('You can attach at most 10 files'),
  ).not.toBeInTheDocument()
})

test('edge-cases 14: attaching a file at exactly 200 MB is accepted and adds the photo', async () => {
  seedResident()
  const { user } = renderAppWithServer('/issues/new', { uid: 'uid-1' })

  await ready()
  const atLimit = makeFile('at-limit.jpg', { size: 200 * 1024 * 1024 })
  await user.upload(fileInput(), atLimit)

  expect(
    await screen.findByRole('button', { name: 'Delete' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByText(
      'File too large: the total size of attachments must not exceed 200 MB',
    ),
  ).not.toBeInTheDocument()
})

test('error-states 2: a failed create shows an error toast, keeps the form for retry, and stores nothing', async () => {
  seedResident()
  const { currentPath, user } = renderAppWithServer('/issues/new', {
    uid: 'uid-1',
  })

  trpcServer.use(trpcMutationError('issues.create'))

  await fillValidForm(user)
  await user.click(submit())

  expect(
    await screen.findByText('Could not save the issue. Please try again.'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/issues/new')
  expect(titleField()).toHaveValue("Kitchen tap won't stop dripping")
  expect(submit()).toBeEnabled()
  expect(fake.listDocs('issues')).toHaveLength(0)
})

test('error-states 7: a partially failed upload still creates the issue and stores only the media that uploaded', async () => {
  seedResident()
  firebaseStorage.failUploadsNamed('bad.jpg')
  const { currentPath, user } = renderAppWithServer('/issues/new', {
    uid: 'uid-1',
  })

  await fillValidForm(user)
  await user.upload(fileInput(), [makeFile('ok.jpg'), makeFile('bad.jpg')])
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  expect(
    await screen.findByText('Issue created. Files not uploaded: 1'),
  ).toBeInTheDocument()

  const stored = fake.listDocs('issues')
  expect(stored).toHaveLength(1)
  expect(stored[0]?.media).toHaveLength(1)
})

test('error-states 7: an entirely failed upload still creates the issue with no media', async () => {
  seedResident()
  firebaseStorage.failUploadsNamed('bad.jpg')
  const { currentPath, user } = renderAppWithServer('/issues/new', {
    uid: 'uid-1',
  })

  await fillValidForm(user)
  await user.upload(fileInput(), makeFile('bad.jpg'))
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  expect(
    await screen.findByText('Issue created. Files not uploaded: 1'),
  ).toBeInTheDocument()

  const stored = fake.listDocs('issues')
  expect(stored).toHaveLength(1)
  expect(stored[0]?.media).toEqual([])
})
