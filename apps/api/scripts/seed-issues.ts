import type { ReactionKind } from '@raiymbek-park/shared/validation-schemas'

import { randomUUID } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { getStorage } from 'firebase-admin/storage'

import { getDb, Timestamp } from '../src/firestore'
import { buildKeywords } from '../src/issues/keywords'
import { resolveBucketName } from '../src/storage'

type SeedIssue = {
  apartment: number
  block: number
  category: string
  commentCount: number
  description: string
  media?: string[]
  name: string
  number: number
  phone: string
  reactions: Record<string, ReactionKind>
  status: string
  tags: string[]
  title: string
  urgent: boolean
}

const hour = 60 * 60 * 1000

const seed: SeedIssue[] = [
  {
    apartment: 45,
    block: 3,
    category: 'repair',
    commentCount: 5,
    description:
      'В подъезде третьего блока протекает труба в подвале, вода стоит уже второй день и подтапливает кладовки.',
    media: ['living-room.jpg', 'raiymbek-park.jpg'],
    name: 'Айгуль Смагулова',
    number: 118,
    phone: '+77011234567',
    reactions: {},
    status: 'new',
    tags: [],
    title: 'Протечка трубы в подвале',
    urgent: true,
  },
  {
    apartment: 12,
    block: 1,
    category: 'complaint',
    commentCount: 0,
    description:
      'Соседи сверху шумят после полуночи почти каждую ночь, слышно громкую музыку и передвижение мебели.',
    name: 'Данияр Ахметов',
    number: 117,
    phone: '+77017654321',
    reactions: {},
    status: 'new',
    tags: [],
    title: 'Ночной шум от соседей',
    urgent: false,
  },
  {
    apartment: 88,
    block: 2,
    category: 'other',
    commentCount: 3,
    description:
      'Предлагаю поставить дополнительные скамейки во дворе рядом с детской площадкой, сидеть негде.',
    media: ['raiymbek-park.jpg'],
    name: 'Марат Оспанов',
    number: 116,
    phone: '+77019998877',
    reactions: {},
    status: 'new',
    tags: [],
    title: 'Скамейки во дворе',
    urgent: false,
  },
  {
    apartment: 30,
    block: 1,
    category: 'replacement',
    commentCount: 8,
    description:
      'Лифт в первом блоке снова застрял между этажами, требуется замена тросов и диагностика механизма подъёма.',
    name: 'Кримбаева Нурсулу Абдугаппаровна-кызы',
    number: 115,
    phone: '+77012223344',
    reactions: { seedUserA: 'like', seedUserB: 'like', seedUserC: 'dislike' },
    status: 'in-progress',
    tags: ['warranty', 'needs-clarification', 'duplicate'],
    title: 'Замена тросов лифта в первом блоке',
    urgent: true,
  },
  {
    apartment: 64,
    block: 4,
    category: 'violation',
    commentCount: 0,
    description:
      'Автомобиль постоянно паркуется на газоне у четвёртого блока, зелёная зона вытоптана полностью.',
    name: 'Гульнара Бекова',
    number: 114,
    phone: '+77015556677',
    reactions: { seedUserA: 'like' },
    status: 'in-progress',
    tags: ['needs-clarification'],
    title: 'Парковка на газоне',
    urgent: false,
  },
  {
    apartment: 5,
    block: 1,
    category: 'repair',
    commentCount: 2,
    description:
      'Домофон на входе не работает уже неделю, дверь не открывается по ключу, приходится ждать соседей.',
    media: ['intercom.jpg'],
    name: 'Ержан Тулегенов',
    number: 113,
    phone: '+77013334455',
    reactions: {},
    status: 'blocked',
    tags: ['needs-clarification'],
    title: 'Не работает домофон',
    urgent: false,
  },
  {
    apartment: 72,
    block: 2,
    category: 'repair',
    commentCount: 0,
    description:
      'Заменили лампочки в подъезде второго блока на всех этажах, освещение восстановлено полностью.',
    name: 'Асель Нурланова',
    number: 112,
    phone: '+77018889900',
    reactions: { seedUserA: 'like', seedUserB: 'like' },
    status: 'done',
    tags: ['warranty'],
    title: 'Освещение в подъезде',
    urgent: false,
  },
  {
    apartment: 20,
    block: 3,
    category: 'complaint',
    commentCount: 0,
    description:
      'Жалоба на состояние мусорных контейнеров признана необоснованной, вывоз осуществляется по графику.',
    name: 'Тимур Сапаров',
    number: 111,
    phone: '+77014445566',
    reactions: {},
    status: 'rejected',
    tags: ['duplicate'],
    title: 'Мусорные контейнеры',
    urgent: false,
  },
]

const designImagesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'design',
  'images',
)

const resolveBucket = async () => getStorage().bucket(await resolveBucketName())

type StorageBucket = Awaited<ReturnType<typeof resolveBucket>>

const uploadMedia = async (
  bucket: StorageBucket,
  issueNumber: number,
  filename: string,
): Promise<string> => {
  const token = randomUUID()
  const destination = `issues/seed-${issueNumber}/${filename}`
  await bucket.upload(join(designImagesDir, filename), {
    destination,
    metadata: {
      contentType: 'image/jpeg',
      metadata: { firebaseStorageDownloadTokens: token },
    },
  })
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media&token=${token}`
}

const run = async () => {
  const collection = getDb().collection('issues')
  const bucket = await resolveBucket()
  const now = Date.now()
  await Promise.all(
    seed.map(async (issue, index) => {
      const media = issue.media
        ? await Promise.all(
            issue.media.map(file => uploadMedia(bucket, issue.number, file)),
          )
        : []
      await collection.doc(`seed-${issue.number}`).set({
        author: {
          apartment: issue.apartment,
          block: issue.block,
          name: issue.name,
          phone: issue.phone,
        },
        authorId: `seed-author-${issue.number}`,
        category: issue.category,
        commentCount: issue.commentCount,
        createdAt: Timestamp.fromMillis(now - index * hour),
        description: issue.description,
        keywords: buildKeywords({
          number: issue.number,
          titles: [issue.title],
        }),
        media,
        number: issue.number,
        reactions: issue.reactions,
        status: issue.status,
        tags: issue.tags,
        title: issue.title,
        urgent: issue.urgent,
      })
    }),
  )
  console.log(
    `Seeded ${seed.length} issues (media uploaded to ${bucket.name}).`,
  )
}

run().then(
  () => process.exit(0),
  error => {
    console.error(error)
    process.exit(1)
  },
)
