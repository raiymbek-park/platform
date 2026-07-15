import type { Issue } from '@raiymbek-park/api'
import type { IssueCreatePayload } from '@raiymbek-park/shared/validation-schemas'

import { issueCreatePayloadSchema } from '@raiymbek-park/shared/validation-schemas'
import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import {
  firebaseAuth,
  firebaseStorage,
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

const makeFile = (
  name: string,
  { size, type = 'image/jpeg' }: { size?: number; type?: string } = {},
) => {
  const file = new File(['x'], name, { type })
  if (size) Object.defineProperty(file, 'size', { value: size })
  return file
}

let issues: Issue[] = []
let lastCreatePayload: IssueCreatePayload | null = null

const toIssue = (payload: IssueCreatePayload, number: number): Issue => ({
  author: { apartment: 42, block: 1, name: 'Алиса' },
  category: payload.category,
  commentCount: 0,
  createdAt: Date.now(),
  description: payload.description,
  dislikeCount: 0,
  id: payload.id,
  isMine: true,
  isTranslated: false,
  isWatching: false,
  keywords: [],
  likeCount: 0,
  media: payload.media,
  myReaction: null,
  number,
  original: null,
  originalLang: 'ru',
  status: 'new',
  tags: [],
  title: payload.title,
  urgent: payload.urgent,
})

const serve = () =>
  trpcServer.use(
    trpcQueries({
      'issues.list': () => ({ issues, nextCursor: null }),
      'resident.me': () => residentMe(),
    }),
    trpcMutation('issues.create', raw => {
      const payload = issueCreatePayloadSchema.parse(raw)
      lastCreatePayload = payload
      const issue = toIssue(payload, issues.length + 1)
      issues = [...issues, issue]
      return issue
    }),
  )

const submit = () => screen.getByRole('button', { name: 'Отправить' })

const selectCategory = () => screen.getByRole('button', { name: /Ремонт/ })

const titleField = () => screen.getByRole('textbox', { name: 'Тема заявки' })

const descriptionField = () => screen.getByRole('textbox', { name: 'Описание' })

const fileInput = () => screen.getByLabelText('Добавить')

const ready = () => screen.findByRole('textbox', { name: 'Тема заявки' })

const fillValidForm = async (
  user: ReturnType<typeof renderApp>['user'],
  {
    title = 'Течёт кран на кухне',
    description = 'Кран течёт уже неделю, нужен мастер',
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
  issues = []
  lastCreatePayload = null
})

test('happy-path 4 / validation 4: submitting a valid issue navigates to the list, shows the new issue, and confirms with a toast', async () => {
  serve()
  const { currentPath, user } = renderApp('/issues/new')

  await fillValidForm(user)
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  expect(await screen.findByText('Течёт кран на кухне')).toBeInTheDocument()
  expect(await screen.findByText('Заявка отправлена.')).toBeInTheDocument()
})

test('validation 1: no category selected keeps the submit button disabled', async () => {
  serve()
  const { user } = renderApp('/issues/new')

  await ready()
  await user.type(titleField(), 'Течёт кран на кухне')
  await user.type(descriptionField(), 'Кран течёт уже неделю, нужен мастер')

  expect(submit()).toBeDisabled()
})

test('validation 2 / edge-cases 1: a title under 3 characters blocks submit, 3 and 80 characters are accepted', async () => {
  serve()
  const { user } = renderApp('/issues/new')

  await ready()
  await user.click(selectCategory())
  await user.type(descriptionField(), 'Кран течёт уже неделю, нужен мастер')

  await user.type(titleField(), 'ав')
  expect(submit()).toBeDisabled()

  await user.clear(titleField())
  await user.click(titleField())
  await user.paste('а'.repeat(3))
  await waitFor(() => expect(submit()).toBeEnabled())

  await user.clear(titleField())
  await user.click(titleField())
  await user.paste('а'.repeat(80))
  await waitFor(() => expect(submit()).toBeEnabled())
})

test('validation 3 / edge-cases 2: a description under 10 characters blocks submit, 10 and 1000 characters are accepted', async () => {
  serve()
  const { user } = renderApp('/issues/new')

  await ready()
  await user.click(selectCategory())
  await user.type(titleField(), 'Течёт кран на кухне')

  await user.type(descriptionField(), 'а'.repeat(9))
  expect(submit()).toBeDisabled()

  await user.clear(descriptionField())
  await user.click(descriptionField())
  await user.paste('а'.repeat(10))
  await waitFor(() => expect(submit()).toBeEnabled())

  await user.clear(descriptionField())
  await user.click(descriptionField())
  await user.paste('а'.repeat(1000))
  await waitFor(() => expect(submit()).toBeEnabled())
})

test('edge-cases 3: a whitespace-only title is treated as empty and blocks submit', async () => {
  serve()
  const { user } = renderApp('/issues/new')

  await ready()
  await user.click(selectCategory())
  await user.type(titleField(), '   ')
  await user.type(descriptionField(), 'Кран течёт уже неделю, нужен мастер')

  expect(submit()).toBeDisabled()
})

test('validation 5 / edge-cases 14: attaching more than 10 files is rejected with a toast and no photo is added', async () => {
  serve()
  const { user } = renderApp('/issues/new')

  await ready()
  const files = Array.from({ length: 11 }, (_, index) =>
    makeFile(`photo-${index}.jpg`),
  )
  await user.upload(fileInput(), files)

  expect(
    await screen.findByText('Можно прикрепить не более 10 файлов'),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Удалить' }),
  ).not.toBeInTheDocument()
})

test('validation 5 / edge-cases 14: attaching a file over 200 MB is rejected with a toast and no photo is added', async () => {
  serve()
  const { user } = renderApp('/issues/new')

  await ready()
  const big = makeFile('big.mp4', {
    size: 200 * 1024 * 1024 + 1,
    type: 'video/mp4',
  })
  await user.upload(fileInput(), big)

  expect(
    await screen.findByText(
      'Файл слишком большой: суммарный размер вложений не должен превышать 200 МБ',
    ),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Удалить' }),
  ).not.toBeInTheDocument()
})

test('edge-cases 14: attaching exactly 10 files is accepted and adds the photos', async () => {
  serve()
  const { user } = renderApp('/issues/new')

  await ready()
  const files = Array.from({ length: 10 }, (_, index) =>
    makeFile(`photo-${index}.jpg`),
  )
  await user.upload(fileInput(), files)

  expect(
    await screen.findByRole('button', { name: 'Удалить' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByText('Можно прикрепить не более 10 файлов'),
  ).not.toBeInTheDocument()
})

test('edge-cases 14: attaching a file at exactly 200 MB is accepted and adds the photo', async () => {
  serve()
  const { user } = renderApp('/issues/new')

  await ready()
  const atLimit = makeFile('at-limit.jpg', { size: 200 * 1024 * 1024 })
  await user.upload(fileInput(), atLimit)

  expect(
    await screen.findByRole('button', { name: 'Удалить' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByText(
      'Файл слишком большой: суммарный размер вложений не должен превышать 200 МБ',
    ),
  ).not.toBeInTheDocument()
})

test('error-states 2: a failed create shows an error toast and keeps the form for retry', async () => {
  serve()
  trpcServer.use(trpcMutationError('issues.create'))
  const { currentPath, user } = renderApp('/issues/new')

  await fillValidForm(user)
  await user.click(submit())

  expect(
    await screen.findByText('Не удалось сохранить заявку. Попробуйте ещё раз.'),
  ).toBeInTheDocument()
  expect(currentPath()).toBe('/issues/new')
  expect(titleField()).toHaveValue('Течёт кран на кухне')
  expect(submit()).toBeEnabled()
})

test('error-states 7: a partially failed upload still creates the issue and reports the failed count', async () => {
  serve()
  firebaseStorage.failUploadsNamed('bad.jpg')
  const { currentPath, user } = renderApp('/issues/new')

  await fillValidForm(user)
  await user.upload(fileInput(), [makeFile('ok.jpg'), makeFile('bad.jpg')])
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  expect(
    await screen.findByText('Заявка создана. Файлов не загрузилось: 1'),
  ).toBeInTheDocument()
  expect(lastCreatePayload?.media).toHaveLength(1)
})

test('error-states 7: an entirely failed upload still creates the issue with no media', async () => {
  serve()
  firebaseStorage.failUploadsNamed('bad.jpg')
  const { currentPath, user } = renderApp('/issues/new')

  await fillValidForm(user)
  await user.upload(fileInput(), makeFile('bad.jpg'))
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  expect(
    await screen.findByText('Заявка создана. Файлов не загрузилось: 1'),
  ).toBeInTheDocument()
  expect(lastCreatePayload?.media).toEqual([])
})

test('happy-path 5: marking urgent and attaching a photo submits urgent true with the uploaded media', async () => {
  serve()
  const { currentPath, user } = renderApp('/issues/new')

  await fillValidForm(user)
  await user.click(screen.getByRole('button', { name: /Срочно/ }))
  await user.upload(fileInput(), makeFile('photo.jpg'))
  await user.click(submit())

  await waitFor(() => expect(currentPath()).toBe('/issues'))
  await screen.findByText('Заявка отправлена.')
  expect(lastCreatePayload?.urgent).toBe(true)
  expect(lastCreatePayload?.media).toHaveLength(1)
})
