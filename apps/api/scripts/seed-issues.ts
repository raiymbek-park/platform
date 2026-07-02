import type { ReactionKind } from '@raiymbek-park/shared/validation-schemas'

import { getDb, Timestamp } from '../src/firestore'

type SeedIssue = {
  apartment: number
  block: number
  category: string
  description: string
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
    description:
      'В подъезде третьего блока протекает труба в подвале, вода стоит уже второй день и подтапливает кладовки.',
    name: 'Айгуль Смагулова',
    number: 118,
    phone: '+77011234567',
    reactions: {},
    status: 'incoming',
    tags: [],
    title: 'Протечка трубы в подвале',
    urgent: true,
  },
  {
    apartment: 12,
    block: 1,
    category: 'complaint',
    description:
      'Соседи сверху шумят после полуночи почти каждую ночь, слышно громкую музыку и передвижение мебели.',
    name: 'Данияр Ахметов',
    number: 117,
    phone: '+77017654321',
    reactions: {},
    status: 'incoming',
    tags: [],
    title: 'Ночной шум от соседей',
    urgent: false,
  },
  {
    apartment: 88,
    block: 2,
    category: 'other',
    description:
      'Предлагаю поставить дополнительные скамейки во дворе рядом с детской площадкой, сидеть негде.',
    name: 'Марат Оспанов',
    number: 116,
    phone: '+77019998877',
    reactions: {},
    status: 'incoming',
    tags: [],
    title: 'Скамейки во дворе',
    urgent: false,
  },
  {
    apartment: 30,
    block: 1,
    category: 'replacement',
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
    description:
      'Домофон на входе не работает уже неделю, дверь не открывается по ключу, приходится ждать соседей.',
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

const run = async () => {
  const collection = getDb().collection('issues')
  const now = Date.now()
  await Promise.all(
    seed.map((issue, index) =>
      collection.doc(`seed-${issue.number}`).set({
        author: {
          apartment: issue.apartment,
          block: issue.block,
          name: issue.name,
          phone: issue.phone,
        },
        category: issue.category,
        createdAt: Timestamp.fromMillis(now - index * hour),
        description: issue.description,
        number: issue.number,
        reactions: issue.reactions,
        status: issue.status,
        tags: issue.tags,
        title: issue.title,
        urgent: issue.urgent,
      }),
    ),
  )
  console.log(`Seeded ${seed.length} issues.`)
}

run().then(
  () => process.exit(0),
  error => {
    console.error(error)
    process.exit(1)
  },
)
