import { fake, injectFake, resetFirestore } from '@raiymbek-park/api/testing'
import { cleanup, screen, waitFor } from '@testing-library/react'
import { delay, HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { queryClient } from '@/shared/api'
import { env } from '@/shared/config'
import {
  firebaseAuth,
  firebaseMessaging,
  firebaseStorage,
  trpcMutationError,
  trpcServer,
} from '@/shared/test'
import { renderAppWithServer } from '@/shared/test/render-app-server'

if (!URL.createObjectURL)
  Object.assign(URL, {
    createObjectURL: () => 'blob:preview',
    revokeObjectURL: () => {},
  })

const uid = 'resident-uid'

const makeFile = (name: string, type = 'image/jpeg') =>
  new File([], name, { type })

const seedResident = (overrides: Record<string, unknown> = {}) =>
  fake.seed(`residents/${uid}`, {
    apartment: 42,
    avatarUrl: null,
    block: 1,
    cars: [],
    isPhoneVisible: false,
    name: 'Alice',
    phone: '+77071234567',
    role: 'owner',
    ...overrides,
  })

const storedResident = () => fake.getDoc(`residents/${uid}`)

const nameField = () => screen.getByLabelText('Name')
const phoneField = () => screen.getByLabelText('Phone')
const apartmentField = () => screen.getByLabelText('Apartment number')
const saveButton = () => screen.getByRole('button', { name: 'Save' })
const avatarFileInput = () => screen.getByLabelText('Add photo')
const removePhotoButton = () =>
  screen.getByRole('button', { name: 'Remove photo' })
const plateInputs = () => screen.getAllByPlaceholderText('A 123 BC 01')
const addPlateButton = () =>
  screen.getByRole('button', { name: 'Add another car plate' })

const plateInputAt = (index: number) => {
  const input = plateInputs()[index]
  if (!input) throw new Error(`no plate input at index ${index}`)
  return input
}

const savedToast = () => screen.findByText('Profile saved.')
const ready = () => screen.findByRole('button', { name: 'Save' })

const reload = async () => {
  cleanup()
  queryClient.clear()
  const app = renderAppWithServer('/settings', { uid })
  await ready()
  return app
}

const breakProfile = () =>
  trpcServer.use(
    http.get(`${env.apiUrl}/*`, ({ request }) => {
      const url = new URL(request.url)
      if (!url.pathname.includes('resident.me')) return undefined
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
    }),
  )

const grantPush = () => {
  firebaseMessaging.supportPush()
  env.vapidKey = 'vapid-test-key'
  const requestPermission = vi.fn(() => Promise.resolve('granted'))
  vi.stubGlobal('Notification', { permission: 'granted', requestPermission })
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { register: vi.fn(() => Promise.resolve({ scope: '/' })) },
  })
  return requestPermission
}

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  firebaseStorage.reset()
  firebaseMessaging.reset()
  env.vapidKey = ''
  fake.reset()
  injectFake()
})

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'serviceWorker')
  env.vapidKey = ''
  resetFirestore()
})

test('the screen opens pre-filled with the saved profile', async () => {
  seedResident({
    apartment: 100,
    avatarUrl: 'https://cdn.test/avatars/resident-uid/current.jpg',
    block: 2,
    cars: ['A123BC01'],
    isPhoneVisible: true,
    name: 'George Lucas',
    phone: '+77051112233',
    role: 'resident',
  })
  renderAppWithServer('/settings', { uid })
  await ready()

  expect(nameField()).toHaveValue('George Lucas')
  expect(phoneField()).toHaveValue('+7 705 111 22 33')
  expect(screen.getByRole('button', { name: /Show/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('button', { name: /Block 2/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(apartmentField()).toHaveValue('100')
  expect(screen.getByRole('button', { name: /Tenant/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(plateInputAt(0)).toHaveValue('A123BC01')
  expect(document.querySelector('img')?.getAttribute('src')).toBe(
    'https://cdn.test/avatars/resident-uid/current.jpg',
  )
})

test('editing the name saves it and survives a reload', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.clear(nameField())
  await user.type(nameField(), 'George Lucas')
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  await waitFor(() => expect(storedResident()?.name).toBe('George Lucas'))

  await reload()
  expect(nameField()).toHaveValue('George Lucas')
})

test('opening phone visibility saves it and survives a reload', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  expect(screen.getByRole('button', { name: /Hide/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await user.click(screen.getByRole('button', { name: /Show/ }))
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  await waitFor(() => expect(storedResident()?.isPhoneVisible).toBe(true))

  await reload()
  expect(screen.getByRole('button', { name: /Show/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('changing block, apartment, and role saves them and survives a reload', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.click(screen.getByRole('button', { name: /Block 2/ }))
  await user.clear(apartmentField())
  await user.type(apartmentField(), '100')
  await user.click(screen.getByRole('button', { name: /Tenant/ }))
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  await waitFor(() =>
    expect(storedResident()).toMatchObject({
      apartment: 100,
      block: 2,
      role: 'tenant',
    }),
  )

  await reload()
  expect(screen.getByRole('button', { name: /Block 2/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(apartmentField()).toHaveValue('100')
  expect(screen.getByRole('button', { name: /Tenant/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('adding a car plate saves it and survives a reload', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.type(plateInputAt(0), 'A 123 BC 01')
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  await waitFor(() => expect(storedResident()?.cars).toEqual(['A123BC01']))

  await reload()
  expect(plateInputs()).toHaveLength(1)
  expect(plateInputAt(0)).toHaveValue('A123BC01')
})

test('removing a car plate saves the change and survives a reload', async () => {
  seedResident({ cars: ['A123BC01'] })
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.click(screen.getByRole('button', { name: 'Remove plate' }))
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  await waitFor(() => expect(storedResident()?.cars).toEqual([]))

  await reload()
  expect(plateInputs()).toHaveLength(1)
  expect(plateInputAt(0)).toHaveValue('')
})

test('adding a second plate row shows an empty input', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.type(plateInputAt(0), 'A 123 BC 01')
  await user.click(addPlateButton())

  expect(plateInputs()).toHaveLength(2)
  expect(plateInputAt(1)).toHaveValue('')
})

test('picking an avatar previews it and stores it after saving and reloading', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  expect(document.querySelector('img')).not.toBeInTheDocument()

  await user.upload(avatarFileInput(), makeFile('photo.jpg'))
  expect(document.querySelector('img')).toBeInTheDocument()

  await user.click(saveButton())
  expect(await savedToast()).toBeInTheDocument()
  await waitFor(() =>
    expect(storedResident()?.avatarUrl).toContain(
      'cdn.test/avatars/resident-uid',
    ),
  )

  await reload()
  const image = document.querySelector('img')
  expect(image?.getAttribute('src')).toContain('cdn.test/avatars/resident-uid')
})

test('a legacy profile without visibility, plates, or avatar renders the defaults', async () => {
  seedResident()
  renderAppWithServer('/settings', { uid })
  await ready()

  expect(screen.getByRole('button', { name: /Hide/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(plateInputs()).toHaveLength(1)
  expect(plateInputAt(0)).toHaveValue('')
  expect(document.querySelector('img')).not.toBeInTheDocument()
})

test('leaving without saving discards the edits', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.clear(nameField())
  await user.type(nameField(), 'Draft')

  await user.click(screen.getByRole('link', { name: 'Home' }))
  await screen.findByRole('link', { name: 'Settings' })
  await user.click(screen.getByRole('link', { name: 'Settings' }))
  await ready()

  expect(nameField()).toHaveValue('Alice')
  expect(storedResident()?.name).toBe('Alice')
})

test('saving with no changes leaves the profile unchanged', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  await waitFor(() =>
    expect(storedResident()).toMatchObject({
      apartment: 42,
      block: 1,
      name: 'Alice',
      role: 'owner',
    }),
  )
})

test('an empty plate row beside a filled one is dropped on save', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.type(plateInputAt(0), 'A 123 BC 01')
  await user.click(addPlateButton())
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  await waitFor(() => expect(storedResident()?.cars).toEqual(['A123BC01']))
})

test('whitespace around the name is trimmed on save', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.clear(nameField())
  await user.type(nameField(), '  George  ')
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  await waitFor(() => expect(storedResident()?.name).toBe('George'))
})

test('replacing an avatar keeps only the latest photo after a reload', async () => {
  seedResident({ avatarUrl: 'https://cdn.test/avatars/resident-uid/old.jpg' })
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  expect(document.querySelector('img')?.getAttribute('src')).toBe(
    'https://cdn.test/avatars/resident-uid/old.jpg',
  )

  await user.upload(avatarFileInput(), makeFile('new.jpg'))
  await user.click(saveButton())
  expect(await savedToast()).toBeInTheDocument()
  await waitFor(() =>
    expect(storedResident()?.avatarUrl).not.toBe(
      'https://cdn.test/avatars/resident-uid/old.jpg',
    ),
  )

  await reload()
  const images = document.querySelectorAll('img')
  expect(images).toHaveLength(1)
  expect(images[0]?.getAttribute('src')).toContain(
    'cdn.test/avatars/resident-uid',
  )
})

test('removing the avatar shows the placeholder after a reload', async () => {
  seedResident({ avatarUrl: 'https://cdn.test/avatars/resident-uid/old.jpg' })
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.click(removePhotoButton())
  expect(document.querySelector('img')).not.toBeInTheDocument()

  await user.click(saveButton())
  expect(await savedToast()).toBeInTheDocument()
  await waitFor(() => expect(storedResident()?.avatarUrl).toBeNull())

  await reload()
  expect(document.querySelector('img')).not.toBeInTheDocument()
})

test('an elevated role is preserved when the form submits a different role', async () => {
  seedResident({ role: 'administration' })
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.click(screen.getByRole('button', { name: /Property owner/ }))
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  await waitFor(() => expect(storedResident()?.role).toBe('administration'))
})

test('a name shorter than the minimum is rejected and nothing is saved', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.clear(nameField())
  await user.type(nameField(), 'A')
  await user.click(saveButton())

  await waitFor(() => expect(nameField()).toHaveValue('A'))
  expect(screen.queryByText('Profile saved.')).not.toBeInTheDocument()
  expect(storedResident()?.name).toBe('Alice')
})

test('an apartment outside the block range shows an error and saves nothing', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.clear(apartmentField())
  await user.type(apartmentField(), '71')
  await user.click(saveButton())

  expect(
    await screen.findByText("Apartment is outside the selected block's range"),
  ).toBeInTheDocument()
  expect(storedResident()?.apartment).toBe(42)
})

test('clearing the apartment shows an error and saves nothing', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.clear(apartmentField())
  await user.click(saveButton())

  expect(
    await screen.findByText('Enter the apartment number'),
  ).toBeInTheDocument()
  expect(storedResident()?.apartment).toBe(42)
})

test('a too-short plate shows an error and saves nothing', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.type(plateInputAt(0), 'A 123')
  await user.click(saveButton())

  expect(
    await screen.findByText('The plate must be 5 to 10 characters long'),
  ).toBeInTheDocument()
  expect(storedResident()?.cars).toEqual([])
})

test('a plate missing a letter or a digit shows an error and saves nothing', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.type(plateInputAt(0), '12345')
  await user.click(saveButton())
  expect(
    await screen.findByText('The plate must contain at least one letter'),
  ).toBeInTheDocument()

  await user.clear(plateInputAt(0))
  await user.type(plateInputAt(0), 'ABCDE')
  await user.click(saveButton())
  expect(
    await screen.findByText('The plate must contain at least one digit'),
  ).toBeInTheDocument()
  expect(storedResident()?.cars).toEqual([])
})

test('typing a lowercase plate shows it uppercased', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.type(plateInputAt(0), 'a 123 bc 01')

  expect(plateInputAt(0)).toHaveValue('A 123 BC 01')
})

test('a duplicate plate shows an error and saves nothing', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.type(plateInputAt(0), 'A 123 BC 01')
  await user.click(addPlateButton())
  await user.type(plateInputAt(1), 'a123bc01')
  await user.click(saveButton())

  expect(
    await screen.findByText('Car plates must not repeat'),
  ).toBeInTheDocument()
  expect(storedResident()?.cars).toEqual([])
})

test('with three filled plates a fourth cannot be added', async () => {
  seedResident({ cars: ['A123BC01', 'B123CD02', 'C123DE03'] })
  renderAppWithServer('/settings', { uid })
  await ready()

  expect(
    screen.queryByRole('button', { name: 'Add another car plate' }),
  ).not.toBeInTheDocument()
})

test('the phone field is read-only', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.click(phoneField())
  await user.keyboard('9999')

  expect(phoneField()).toHaveValue('+7 707 123 45 67')
})

test('a resident registered without a phone shows an empty phone field', async () => {
  seedResident({ phone: '' })
  renderAppWithServer('/settings', { uid })
  await ready()

  expect(phoneField()).toHaveValue('')
})

test('a failed save shows an error, keeps the values, and the stored profile survives a reload', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()
  trpcServer.use(trpcMutationError('resident.update'))

  await user.clear(nameField())
  await user.type(nameField(), 'George Lucas')
  await user.click(saveButton())

  expect(
    await screen.findByText('Failed to save your profile. Please try again.'),
  ).toBeInTheDocument()
  expect(nameField()).toHaveValue('George Lucas')

  await reload()
  expect(nameField()).toHaveValue('Alice')
})

test('an avatar upload failure surfaces an error and saves nothing', async () => {
  seedResident()
  firebaseStorage.failUploadsNamed('photo.jpg')
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.upload(avatarFileInput(), makeFile('photo.jpg'))
  await user.click(saveButton())

  expect(
    await screen.findByText('Failed to save your profile. Please try again.'),
  ).toBeInTheDocument()
  expect(storedResident()?.avatarUrl).toBeNull()
})

test('saving disables the button while pending and a second tap sends no duplicate', async () => {
  seedResident()
  let updateCalls = 0
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()
  trpcServer.use(
    http.post(`${env.apiUrl}/resident.update`, async () => {
      updateCalls += 1
      await delay('infinite')
      return HttpResponse.json([{ result: { data: { ok: true } } }])
    }),
  )

  await user.click(saveButton())

  await waitFor(() => expect(saveButton()).toBeDisabled())
  await user.click(saveButton())

  expect(updateCalls).toBe(1)
})

test('a failed profile load shows the error state instead of the form', async () => {
  seedResident()
  renderAppWithServer('/settings', { uid })
  breakProfile()

  expect(
    await screen.findByText('Something went wrong', undefined, {
      timeout: 4000,
    }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
})

test('a visitor without a session is redirected away from settings', async () => {
  firebaseAuth.reset()
  const { currentPath } = renderAppWithServer('/settings', { uid: null })

  await waitFor(() => expect(currentPath()).toBe('/onboarding/auth-method'))
  expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
})

test('saving updates other pages consuming the profile without a reload', async () => {
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.click(screen.getByRole('button', { name: /Block 2/ }))
  await user.clear(apartmentField())
  await user.type(apartmentField(), '100')
  await user.click(saveButton())
  expect(await savedToast()).toBeInTheDocument()

  await user.click(screen.getByRole('link', { name: 'Home' }))

  expect(await screen.findByText('Block 2 · Apartment 100')).toBeInTheDocument()
})

test('switching the interface language re-registers the push token silently', async () => {
  const requestPermission = grantPush()
  seedResident()
  const { user } = renderAppWithServer('/settings', { uid })
  await ready()

  await user.click(screen.getByRole('button', { name: /Русский/ }))

  await waitFor(() =>
    expect(
      fake.getDoc(`residents/${uid}/pushTokens/push-token-1`),
    ).toMatchObject({ locale: 'en', token: 'push-token-1' }),
  )
  expect(requestPermission).not.toHaveBeenCalled()
})
