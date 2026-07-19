import { fake, injectFake, resetFirestore } from '@raiymbek-park/api/testing'
import { screen, waitFor, within } from '@testing-library/react'
import { delay, HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { env } from '@/shared/config'
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
  const file = new File([], name, { type })
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size })
  return file
}

const submit = () => screen.getByRole('button', { name: 'Publish' })

const titleField = () => screen.getByRole('textbox', { name: 'Title' })

const descriptionField = () =>
  screen.getByRole('textbox', { name: 'Description' })

const fileInput = () => screen.getByLabelText('Add')

const ready = () => screen.findByRole('textbox', { name: 'Title' })

const feedTab = (name: string) =>
  within(screen.getByRole('group', { name: 'Фильтр объявлений' })).getByRole(
    'button',
    { name },
  )

const seedResident = (role: string) =>
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
  category: string,
  {
    title = 'Selling a mountain bike',
    description = 'Almost new bike, rode it for a month',
  } = {},
) => {
  await ready()
  await user.click(screen.getByRole('button', { name: new RegExp(category) }))
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

test('happy-path 8: a Resident publishes an offer, sees the phone notice, and it appears under Private ads', async () => {
  seedResident('resident')
  const { currentPath, user } = renderAppWithServer('/posts/new', {
    uid: 'uid-1',
  })

  expect(
    await screen.findByText('Your phone number will be visible to everyone.'),
  ).toBeInTheDocument()

  await fillValidForm(user, 'Services')
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(await screen.findByText('Selling a mountain bike')).toBeInTheDocument()
  expect(await screen.findByText('Post published.')).toBeInTheDocument()
  expect(feedTab('Private ads')).toHaveAttribute('aria-pressed', 'true')

  const stored = fake.listDocs('posts')
  expect(stored).toHaveLength(1)
  expect(stored[0]).toMatchObject({
    authorId: 'uid-1',
    category: 'services',
    kind: 'offer',
    title: 'Selling a mountain bike',
  })
})

test('happy-path 9: a Manager publishes an announcement with no phone notice, and it appears under Notices', async () => {
  seedResident('manager')
  const { currentPath, user } = renderAppWithServer('/posts/new', {
    uid: 'uid-1',
  })

  await ready()
  expect(
    screen.queryByText('Your phone number will be visible to everyone.'),
  ).not.toBeInTheDocument()

  await fillValidForm(user, 'Management company', {
    description: 'Scheduled water shutdown on all floors of the building',
    title: 'Water shutdown',
  })
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(await screen.findByText('Water shutdown')).toBeInTheDocument()
  expect(feedTab('Notices')).toHaveAttribute('aria-pressed', 'true')

  const stored = fake.listDocs('posts')
  expect(stored).toHaveLength(1)
  expect(stored[0]).toMatchObject({
    authorId: 'uid-1',
    category: 'management',
    kind: 'announcement',
    title: 'Water shutdown',
  })
})

test('a partially failed upload still publishes the offer and stores only the media that uploaded', async () => {
  seedResident('resident')
  firebaseStorage.failUploadsNamed('bad.jpg')
  const { currentPath, user } = renderAppWithServer('/posts/new', {
    uid: 'uid-1',
  })

  await fillValidForm(user, 'Services')
  await user.upload(fileInput(), [makeFile('ok.jpg'), makeFile('bad.jpg')])
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(
    await screen.findByText('Post published. Files failed to upload: 1'),
  ).toBeInTheDocument()

  const stored = fake.listDocs('posts')
  expect(stored).toHaveLength(1)
  expect(stored[0]?.media).toHaveLength(1)
})

test('an entirely failed upload still publishes the offer with no media stored', async () => {
  seedResident('resident')
  firebaseStorage.failUploadsNamed('bad.jpg')
  const { currentPath, user } = renderAppWithServer('/posts/new', {
    uid: 'uid-1',
  })

  await fillValidForm(user, 'Services')
  await user.upload(fileInput(), makeFile('bad.jpg'))
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/posts'))
  expect(
    await screen.findByText('Post published. Files failed to upload: 1'),
  ).toBeInTheDocument()

  const stored = fake.listDocs('posts')
  expect(stored).toHaveLength(1)
  expect(stored[0]?.media).toEqual([])
})

test('validation 1 / edge-cases 12: a title under 3 characters blocks submission; 3 and 80 characters are accepted', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

  await ready()
  await user.click(screen.getByRole('button', { name: /Services/ }))
  await user.type(descriptionField(), 'Almost new bike, rode it for a month')

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

test('validation 2 / edge-cases 13: a description under 10 characters blocks submission; 10 and 1000 characters are accepted', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

  await ready()
  await user.click(screen.getByRole('button', { name: /Services/ }))
  await user.type(titleField(), 'Selling a mountain bike')

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

test('validation 3: no category selected keeps the submit button disabled', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

  await ready()
  await user.type(titleField(), 'Selling a mountain bike')
  await user.type(descriptionField(), 'Almost new bike, rode it for a month')

  expect(submit()).toBeDisabled()
})

test('validation 4: attaching more than 10 files is rejected and no photo is added', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

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

test('validation 4: attaching a file over 200 MB is rejected and no photo is added', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

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

test('edge-cases 14: attaching exactly 10 files whose combined size is exactly 200 MB is accepted', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

  await ready()
  const files = Array.from({ length: 10 }, (_, index) =>
    makeFile(`photo-${index}.jpg`, {
      size: index === 0 ? 200 * 1024 * 1024 : 0,
    }),
  )
  await user.upload(fileInput(), files)

  expect(
    await screen.findByRole('button', { name: 'Delete' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByText('You can attach at most 10 files'),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByText(
      'File too large: the total size of attachments must not exceed 200 MB',
    ),
  ).not.toBeInTheDocument()
})

test('validation 11: the save action disables while the mutation is pending, and a second tap does not send a duplicate request', async () => {
  seedResident('resident')
  const { user } = renderAppWithServer('/posts/new', { uid: 'uid-1' })

  let createCalls = 0
  trpcServer.use(
    http.post(`${env.apiUrl}/posts.create`, async () => {
      createCalls += 1
      await delay('infinite')
      return HttpResponse.json([{ result: { data: { id: 'post-x' } } }])
    }),
  )

  await fillValidForm(user, 'Services')
  await user.click(submit())

  await waitFor(() => expect(submit()).toBeDisabled())
  await user.click(submit())

  expect(createCalls).toBe(1)
})

test('error-states 3: a lost session during save aborts the create and preserves the entered content for retry', async () => {
  seedResident('resident')
  const { currentPath, user } = renderAppWithServer('/posts/new', {
    uid: 'uid-1',
  })

  await fillValidForm(user, 'Services')
  firebaseAuth.signOut()
  await user.click(submit())

  expect(
    await screen.findByText('Could not publish the post. Please try again.'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/posts/new')
  expect(titleField()).toHaveValue('Selling a mountain bike')
  expect(descriptionField()).toHaveValue('Almost new bike, rode it for a month')
  expect(fake.listDocs('posts')).toHaveLength(0)
})

test('error-states 4 / error-states 8: a failed create surfaces the error and preserves the entered title, description, category, and media for retry', async () => {
  seedResident('resident')
  const { currentPath, user } = renderAppWithServer('/posts/new', {
    uid: 'uid-1',
  })

  trpcServer.use(trpcMutationError('posts.create'))

  await fillValidForm(user, 'Services')
  await user.upload(fileInput(), makeFile('photo.jpg'))
  await user.click(submit())

  expect(
    await screen.findByText('Could not publish the post. Please try again.'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/posts/new')
  expect(titleField()).toHaveValue('Selling a mountain bike')
  expect(descriptionField()).toHaveValue('Almost new bike, rode it for a month')
  expect(screen.getByRole('button', { name: /Services/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  expect(submit()).toBeEnabled()
  expect(fake.listDocs('posts')).toHaveLength(0)
})
