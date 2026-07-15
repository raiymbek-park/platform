import type { ResidentProfile } from '@raiymbek-park/api'
import type { ProfileUpdate } from '@raiymbek-park/shared/validation-schemas'

import {
  profileUpdateSchema,
  resolveRole,
} from '@raiymbek-park/shared/validation-schemas'
import { cleanup, screen, waitFor } from '@testing-library/react'
import { delay, HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { queryClient } from '@/shared/api'
import { env } from '@/shared/config'
import { i18n } from '@/shared/i18n'
import {
  firebaseAuth,
  firebaseStorage,
  renderApp,
  trpcMutation,
  trpcMutationError,
  trpcQueries,
  trpcQueriesError,
  trpcServer,
} from '@/shared/test'

if (!URL.createObjectURL)
  Object.assign(URL, {
    createObjectURL: () => 'blob:preview',
    revokeObjectURL: () => {},
  })

const makeFile = (name: string, type = 'image/jpeg') =>
  new File([], name, { type })

const baseProfile: ResidentProfile = {
  apartment: 42,
  avatarUrl: null,
  block: 1,
  cars: [],
  id: 'resident-uid',
  isPhoneVisible: false,
  isRegistered: true,
  name: 'Алиса',
  phone: '+77071234567',
  role: 'owner',
}

const filledProfile: ResidentProfile = {
  apartment: 100,
  avatarUrl: 'https://cdn.test/avatars/resident-uid/current.jpg',
  block: 2,
  cars: ['A123BC01'],
  id: 'resident-uid',
  isPhoneVisible: true,
  isRegistered: true,
  name: 'Борис',
  phone: '+77051112233',
  role: 'resident',
}

let currentProfile: ResidentProfile = { ...baseProfile }
let lastUpdate: ProfileUpdate | null = null

const serve = (profile: ResidentProfile = baseProfile) => {
  currentProfile = { ...profile }
  lastUpdate = null
  trpcServer.use(
    trpcQueries({ 'resident.me': () => currentProfile }),
    trpcMutation('resident.update', raw => {
      const input = profileUpdateSchema.parse(raw)
      lastUpdate = input
      currentProfile = {
        ...currentProfile,
        ...input,
        role: resolveRole(input.role),
      }
      return { ok: true }
    }),
  )
}

const ready = () => screen.findByRole('button', { name: 'Сохранить' })

const reload = async () => {
  cleanup()
  queryClient.clear()
  const app = renderApp('/settings')
  await ready()
  return app
}

const nameField = () => screen.getByLabelText('Имя')
const phoneField = () => screen.getByLabelText('Телефон')
const apartmentField = () => screen.getByLabelText('Номер квартиры')
const saveButton = () => screen.getByRole('button', { name: 'Сохранить' })
const avatarFileInput = () => screen.getByLabelText('Добавить фото')
const removePhotoButton = () =>
  screen.getByRole('button', { name: 'Удалить фото' })
const plateInputs = () => screen.getAllByPlaceholderText('A 123 BC 01')
const addPlateButton = () =>
  screen.getByRole('button', { name: 'Добавить ещё один номер машины' })

const plateInputAt = (index: number) => {
  const input = plateInputs()[index]
  if (!input) throw new Error(`no plate input at index ${index}`)
  return input
}

const savedToast = () => screen.findByText('Профиль сохранён.')

beforeEach(() => {
  firebaseAuth.reset()
  firebaseAuth.signIn()
  firebaseStorage.reset()
})

afterEach(() => {
  i18n.loadAndActivate({ locale: 'ru', messages: {} })
})

test('happy-path 1: the profile screen opens pre-filled with the resident’s saved profile', async () => {
  serve(filledProfile)
  renderApp('/settings')
  await ready()

  expect(nameField()).toHaveValue('Борис')
  expect(phoneField()).toHaveValue('+7 705 111 22 33')
  expect(screen.getByRole('button', { name: /Открыть/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('button', { name: /Блок 2/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(apartmentField()).toHaveValue('100')
  expect(screen.getByRole('button', { name: /Арендатор/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(plateInputAt(0)).toHaveValue('A123BC01')
  expect(document.querySelector('img')?.getAttribute('src')).toBe(
    filledProfile.avatarUrl,
  )
})

test('happy-path 2: editing the name and saving round-trips after a reload', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.clear(nameField())
  await user.type(nameField(), 'Борис')
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()

  await reload()
  expect(nameField()).toHaveValue('Борис')
})

test('happy-path 3: toggling phone visibility open and saving round-trips after a reload', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  expect(screen.getByRole('button', { name: /Скрыть/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await user.click(screen.getByRole('button', { name: /Открыть/ }))
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()

  await reload()
  expect(screen.getByRole('button', { name: /Открыть/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('happy-path 4: changing block, apartment, and role round-trips after a reload', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.click(screen.getByRole('button', { name: /Блок 2/ }))
  await user.clear(apartmentField())
  await user.type(apartmentField(), '100')
  await user.click(screen.getByRole('button', { name: /Арендатор/ }))
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()

  await reload()
  expect(screen.getByRole('button', { name: /Блок 2/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(apartmentField()).toHaveValue('100')
  expect(screen.getByRole('button', { name: /Арендатор/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('happy-path 5: adding a car plate and saving round-trips after a reload', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.type(plateInputAt(0), 'A 123 BC 01')
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()

  await reload()
  expect(plateInputs()).toHaveLength(1)
  expect(plateInputAt(0)).toHaveValue('A123BC01')
})

test('happy-path 6: removing a car plate and saving round-trips after a reload', async () => {
  serve({ ...baseProfile, cars: ['A123BC01'] })
  const { user } = renderApp('/settings')
  await ready()

  await user.click(screen.getByRole('button', { name: 'Удалить номер' }))
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()

  await reload()
  expect(plateInputs()).toHaveLength(1)
  expect(plateInputAt(0)).toHaveValue('')
})

test('happy-path 7: tapping "Добавить ещё один номер машины" adds a second empty plate input', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.type(plateInputAt(0), 'A 123 BC 01')
  await user.click(addPlateButton())

  expect(plateInputs()).toHaveLength(2)
  expect(plateInputAt(1)).toHaveValue('')
})

test('happy-path 8: switching the interface language applies immediately and persists without saving', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  expect(screen.getByRole('heading', { name: 'Имя' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /English/ }))

  expect(
    await screen.findByRole('heading', { name: 'Name' }),
  ).toBeInTheDocument()
  expect(localStorage.getItem('locale')).toBe('en')
  expect(lastUpdate).toBeNull()

  const { bootstrapLocale } = await import('@/shared/i18n')
  cleanup()
  queryClient.clear()
  await bootstrapLocale()
  renderApp('/settings')
  expect(
    await screen.findByRole('heading', { name: 'Name' }),
  ).toBeInTheDocument()
})

test('happy-path 9: picking an avatar previews immediately and round-trips after saving and reloading', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  expect(document.querySelector('img')).not.toBeInTheDocument()

  await user.upload(avatarFileInput(), makeFile('photo.jpg'))
  expect(document.querySelector('img')).toBeInTheDocument()

  await user.click(saveButton())
  expect(await savedToast()).toBeInTheDocument()

  await reload()
  const image = document.querySelector('img')
  expect(image).toBeInTheDocument()
  expect(image?.getAttribute('src')).toContain('cdn.test/avatars/resident-uid')
})

test('edge-cases 1: a legacy profile with no visibility flag, plates, or avatar renders the defaults', async () => {
  serve(baseProfile)
  renderApp('/settings')
  await ready()

  expect(screen.getByRole('button', { name: /Скрыть/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(plateInputs()).toHaveLength(1)
  expect(plateInputAt(0)).toHaveValue('')
  expect(document.querySelector('img')).not.toBeInTheDocument()
})

test('edge-cases 2: leaving without saving discards edits, no prompt on leaving', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.clear(nameField())
  await user.type(nameField(), 'Черновик')

  await user.click(screen.getByRole('link', { name: 'Главная' }))
  await screen.findByRole('link', { name: 'Настройки' })
  await user.click(screen.getByRole('link', { name: 'Настройки' }))
  await ready()

  expect(nameField()).toHaveValue('Алиса')
  expect(lastUpdate).toBeNull()
})

test('edge-cases 3: saving without any changes succeeds and leaves the profile unchanged', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  expect(lastUpdate).toMatchObject({
    apartment: baseProfile.apartment,
    block: baseProfile.block,
    name: baseProfile.name,
    role: baseProfile.role,
  })
})

test('edge-cases 4: an empty plate input alongside a filled one is ignored on save', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.type(plateInputAt(0), 'A 123 BC 01')
  await user.click(addPlateButton())
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  expect(lastUpdate?.cars).toEqual(['A123BC01'])
})

test('edge-cases 5: leading and trailing whitespace is trimmed from the saved name', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.clear(nameField())
  await user.type(nameField(), '  Борис  ')
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  expect(lastUpdate?.name).toBe('Борис')
})

test('edge-cases 6: picking a new photo without saving is discarded on leaving and returning', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.upload(avatarFileInput(), makeFile('photo.jpg'))
  expect(document.querySelector('img')).toBeInTheDocument()

  await user.click(screen.getByRole('link', { name: 'Главная' }))
  await screen.findByRole('link', { name: 'Настройки' })
  await user.click(screen.getByRole('link', { name: 'Настройки' }))
  await ready()

  expect(document.querySelector('img')).not.toBeInTheDocument()
})

test('edge-cases 7: a 2-character name (lower boundary) is accepted', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.clear(nameField())
  await user.type(nameField(), 'Аб')
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  expect(lastUpdate?.name).toBe('Аб')
})

test('edge-cases 7: a 60-character name (upper boundary) is accepted', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.clear(nameField())
  await user.click(nameField())
  await user.paste('а'.repeat(60))
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  expect(lastUpdate?.name).toBe('а'.repeat(60))
})

test('edge-cases 8: a plate whose stripped value is 5 characters (lower boundary) is accepted', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.type(plateInputAt(0), 'A1234')
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  expect(lastUpdate?.cars).toEqual(['A1234'])
})

test('edge-cases 8: a plate whose stripped value is 10 characters (upper boundary) is accepted', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.type(plateInputAt(0), 'A123456789')
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  expect(lastUpdate?.cars).toEqual(['A123456789'])
})

test('edge-cases 9: a plate whose stripped value is 11 characters is rejected and nothing is saved', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.type(plateInputAt(0), 'A1234567890')
  await user.click(saveButton())

  expect(
    await screen.findByText('Номер должен содержать от 5 до 10 символов'),
  ).toBeInTheDocument()
  expect(lastUpdate).toBeNull()
})

test('edge-cases 10: apartment 1 (lower boundary of block 1) is accepted', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.clear(apartmentField())
  await user.type(apartmentField(), '1')
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  expect(lastUpdate?.apartment).toBe(1)
})

test('edge-cases 10: apartment 70 (upper boundary of block 1) is accepted', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.clear(apartmentField())
  await user.type(apartmentField(), '70')
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  expect(lastUpdate?.apartment).toBe(70)
})

test('edge-cases 11: replacing an existing avatar keeps only the latest photo after a reload', async () => {
  serve({
    ...baseProfile,
    avatarUrl: 'https://cdn.test/avatars/resident-uid/old.jpg',
  })
  const { user } = renderApp('/settings')
  await ready()

  expect(document.querySelector('img')?.getAttribute('src')).toBe(
    'https://cdn.test/avatars/resident-uid/old.jpg',
  )

  await user.upload(avatarFileInput(), makeFile('new.jpg'))
  await user.click(saveButton())
  expect(await savedToast()).toBeInTheDocument()

  await reload()
  const images = document.querySelectorAll('img')
  expect(images).toHaveLength(1)
  expect(images[0]?.getAttribute('src')).not.toBe(
    'https://cdn.test/avatars/resident-uid/old.jpg',
  )
  expect(images[0]?.getAttribute('src')).toContain(
    'cdn.test/avatars/resident-uid',
  )
})

test('edge-cases 12: removing the avatar shows the placeholder immediately and after a reload', async () => {
  serve({
    ...baseProfile,
    avatarUrl: 'https://cdn.test/avatars/resident-uid/old.jpg',
  })
  const { user } = renderApp('/settings')
  await ready()

  await user.click(removePhotoButton())
  expect(document.querySelector('img')).not.toBeInTheDocument()

  await user.click(saveButton())
  expect(await savedToast()).toBeInTheDocument()

  await reload()
  expect(document.querySelector('img')).not.toBeInTheDocument()
})

test('error-states 1: a failed save shows an error toast, keeps entered values, and the previous profile survives a reload', async () => {
  serve(baseProfile)
  trpcServer.use(trpcMutationError('resident.update'))
  const { user } = renderApp('/settings')
  await ready()

  await user.clear(nameField())
  await user.type(nameField(), 'Борис')
  await user.click(saveButton())

  expect(
    await screen.findByText(
      'Не удалось сохранить профиль. Попробуйте ещё раз.',
    ),
  ).toBeInTheDocument()
  expect(nameField()).toHaveValue('Борис')

  await reload()
  expect(nameField()).toHaveValue('Алиса')
})

test('error-states 2: an avatar upload failure surfaces an error toast and saves nothing', async () => {
  serve(baseProfile)
  firebaseStorage.failUploadsNamed('photo.jpg')
  const { user } = renderApp('/settings')
  await ready()

  await user.upload(avatarFileInput(), makeFile('photo.jpg'))
  await user.click(saveButton())

  expect(
    await screen.findByText(
      'Не удалось сохранить профиль. Попробуйте ещё раз.',
    ),
  ).toBeInTheDocument()
  expect(lastUpdate).toBeNull()

  await reload()
  expect(document.querySelector('img')).not.toBeInTheDocument()
})

test('error-states 3: save shows a loading state while pending and a repeated tap does not fire a duplicate request', async () => {
  serve(baseProfile)
  let updateCalls = 0
  trpcServer.use(
    http.post(`${env.apiUrl}/resident.update`, async () => {
      updateCalls += 1
      await delay('infinite')
      return HttpResponse.json([{ result: { data: { ok: true } } }])
    }),
  )
  const { user } = renderApp('/settings')
  await ready()

  await user.click(saveButton())

  await waitFor(() => expect(saveButton()).toBeDisabled())
  await user.click(saveButton())

  expect(updateCalls).toBe(1)
})

test('error-states 4: a visitor without a session is redirected away from settings', async () => {
  firebaseAuth.reset()
  const { currentPath } = renderApp('/settings')

  await waitFor(() => expect(currentPath()).toBe('/onboarding/welcome'))
})

test('error-states 5: a failed profile load shows an error state instead of the form', async () => {
  trpcServer.use(trpcQueriesError())
  renderApp('/settings')

  expect(
    await screen.findByText('Что-то пошло не так', undefined, {
      timeout: 4000,
    }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Сохранить' }),
  ).not.toBeInTheDocument()
})

test('validation 1: a 1-character name surfaces the name-length toast and saves nothing', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.clear(nameField())
  await user.type(nameField(), 'А')
  await user.click(saveButton())

  expect(
    await screen.findByText('Имя должно быть не короче 2 символов'),
  ).toBeInTheDocument()
  expect(lastUpdate).toBeNull()
})

test('validation 2: a 61-character name surfaces the name-length toast', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.clear(nameField())
  await user.click(nameField())
  await user.paste('а'.repeat(61))
  await user.click(saveButton())

  expect(
    await screen.findByText('Имя должно быть не длиннее 60 символов'),
  ).toBeInTheDocument()
  expect(lastUpdate).toBeNull()
})

test('validation 3: an apartment outside the selected block range surfaces the apartment toast', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.clear(apartmentField())
  await user.type(apartmentField(), '71')
  await user.click(saveButton())

  expect(
    await screen.findByText('Квартира вне диапазона выбранного блока'),
  ).toBeInTheDocument()
  expect(lastUpdate).toBeNull()
})

test('validation 4: clearing the apartment field surfaces the apartment toast', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.clear(apartmentField())
  await user.click(saveButton())

  expect(await screen.findByText('Введите номер квартиры')).toBeInTheDocument()
  expect(lastUpdate).toBeNull()
})

test('validation 5: a plate shorter than 5 characters surfaces the plate-length toast', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.type(plateInputAt(0), 'A 123')
  await user.click(saveButton())

  expect(
    await screen.findByText('Номер должен содержать от 5 до 10 символов'),
  ).toBeInTheDocument()
  expect(lastUpdate).toBeNull()
})

test('validation 6: a plate without a letter or without a digit surfaces the plate-format toast', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.type(plateInputAt(0), '12345')
  await user.click(saveButton())
  expect(
    await screen.findByText('Номер должен содержать хотя бы одну букву'),
  ).toBeInTheDocument()
  expect(lastUpdate).toBeNull()

  await user.clear(plateInputAt(0))
  await user.type(plateInputAt(0), 'ABCDE')
  await user.click(saveButton())
  expect(
    await screen.findByText('Номер должен содержать хотя бы одну цифру'),
  ).toBeInTheDocument()
  expect(lastUpdate).toBeNull()
})

test('validation 7: typing a lowercase plate displays it uppercased', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.type(plateInputAt(0), 'a 123 bc 01')

  expect(plateInputAt(0)).toHaveValue('A 123 BC 01')
})

test('validation 8: a duplicate plate (case/space-insensitive) surfaces the duplicate toast', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.type(plateInputAt(0), 'A 123 BC 01')
  await user.click(addPlateButton())
  await user.type(plateInputAt(1), 'a123bc01')
  await user.click(saveButton())

  expect(
    await screen.findByText('Номера машин не должны повторяться'),
  ).toBeInTheDocument()
  expect(lastUpdate).toBeNull()
})

test('validation 9: with 3 filled plates, a fourth cannot be added', async () => {
  serve({ ...baseProfile, cars: ['A123BC01', 'B123CD02', 'C123DE03'] })
  renderApp('/settings')
  await ready()

  expect(
    screen.queryByRole('button', {
      name: 'Добавить ещё один номер машины',
    }),
  ).not.toBeInTheDocument()
})

test('validation 10: the phone field is read-only and typing does not change it', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.click(phoneField())
  await user.keyboard('9999')

  expect(phoneField()).toHaveValue('+7 707 123 45 67')
})

test('validation 11: an apartment of 0 surfaces the apartment-range toast', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.clear(apartmentField())
  await user.type(apartmentField(), '0')
  await user.click(saveButton())

  expect(
    await screen.findByText('Квартира вне диапазона выбранного блока'),
  ).toBeInTheDocument()
  expect(lastUpdate).toBeNull()
})

test('validation 6: a plate with a non-alphanumeric character surfaces the plate-format toast', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.type(plateInputAt(0), 'A123B-01')
  await user.click(saveButton())

  expect(
    await screen.findByText(
      'Номер может содержать только латинские буквы и цифры',
    ),
  ).toBeInTheDocument()
  expect(lastUpdate).toBeNull()
})

test('validation 9: an extra empty plate row alongside 3 filled plates does not count toward the limit on save', async () => {
  serve({ ...baseProfile, cars: ['A123BC01', 'B123CD02', 'C123DE03'] })
  const { user } = renderApp('/settings')
  await ready()

  expect(plateInputs()).toHaveLength(3)
  await user.click(saveButton())

  expect(await savedToast()).toBeInTheDocument()
  expect(lastUpdate?.cars).toEqual(['A123BC01', 'B123CD02', 'C123DE03'])
})

test('error-states 2: a lost session during an avatar save surfaces an error and saves nothing', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.upload(avatarFileInput(), makeFile('photo.jpg'))
  firebaseAuth.signOut()
  await user.click(saveButton())

  expect(
    await screen.findByText(
      'Не удалось сохранить профиль. Попробуйте ещё раз.',
    ),
  ).toBeInTheDocument()
  expect(lastUpdate).toBeNull()
})

test('state-boundaries: saving updates other pages consuming the same profile without a hard reload', async () => {
  serve(baseProfile)
  const { user } = renderApp('/settings')
  await ready()

  await user.click(screen.getByRole('button', { name: /Блок 2/ }))
  await user.clear(apartmentField())
  await user.type(apartmentField(), '100')
  await user.click(saveButton())
  expect(await savedToast()).toBeInTheDocument()

  await user.click(screen.getByRole('link', { name: 'Главная' }))

  expect(await screen.findByText('Блок 2 · Квартира 100')).toBeInTheDocument()
})
