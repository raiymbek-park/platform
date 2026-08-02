import type {
  IssueCategory,
  IssueStatus,
  PostCategory,
  PostKind,
} from '@raiymbek-park/shared/validation-schemas'

import { searchPrefixes, tokenize } from '@raiymbek-park/shared'

import { Timestamp } from '../firestore'
import { e2ePhones } from '../otp/test-codes'
import { authFake } from './auth-fake'
import { fake } from './firestore-fake'

const SEEDED_AT = 1_699_000_000_000

const neighbour = {
  author: {
    apartment: 12,
    block: 1,
    name: 'Георгий Лукас',
    phone: '+7 747 000 11 22',
  },
  authorId: 'e2e-neighbour',
}

type ResidentSeed = {
  apartment: number
  block: number
  key: keyof typeof e2ePhones
  name: string
  role: string
}

const residents: ResidentSeed[] = [
  { apartment: 42, block: 1, key: 'home', name: 'Алина Ким', role: 'resident' },
  { apartment: 7, block: 2, key: 'i18n', name: 'Ержан Абай', role: 'resident' },
  {
    apartment: 15,
    block: 1,
    key: 'issues',
    name: 'Мария Ли',
    role: 'resident',
  },
  {
    apartment: 23,
    block: 3,
    key: 'posts',
    name: 'Данияр Сеит',
    role: 'resident',
  },
  {
    apartment: 88,
    block: 2,
    key: 'profile',
    name: 'Сауле Нур',
    role: 'resident',
  },
]

export const e2eUid = (key: keyof typeof e2ePhones): string => `e2e-${key}`

const keywordsOf = (...parts: string[]): string[] => [
  ...new Set(parts.flatMap(tokenize).flatMap(searchPrefixes)),
]

const seedResident = ({ apartment, block, key, name, role }: ResidentSeed) =>
  fake.seed(`residents/${e2eUid(key)}`, {
    apartment,
    avatarUrl: null,
    block,
    cars: [],
    isPhoneVisible: false,
    name,
    phone: e2ePhones[key],
    role,
  })

type PostSeed = {
  category: PostCategory
  createdAt: number
  description: string
  id: string
  kind: PostKind
  title: string
}

const posts: PostSeed[] = [
  {
    category: 'city',
    createdAt: SEEDED_AT,
    description:
      'В четверг с 10:00 до 18:00 в блоках 1 и 2 отключат холодную воду.',
    id: 'e2e-water',
    kind: 'announcement',
    title: 'Плановое отключение воды',
  },
  {
    category: 'sell',
    createdAt: SEEDED_AT - 1000,
    description: 'Велосипед в отличном состоянии, куплен год назад.',
    id: 'e2e-bike',
    kind: 'offer',
    title: 'Продам горный велосипед',
  },
]

const seedPost = ({
  category,
  createdAt,
  description,
  id,
  kind,
  title,
}: PostSeed) =>
  fake.seed(`posts/${id}`, {
    ...neighbour,
    category,
    commentCount: 0,
    createdAt: Timestamp.fromMillis(createdAt),
    description,
    keywords: keywordsOf(title),
    kind,
    lang: 'ru',
    media: [],
    reactions: {},
    title,
  })

type IssueSeed = {
  category: IssueCategory
  createdAt: number
  description: string
  id: string
  number: number
  status: IssueStatus
  title: string
}

const issues: IssueSeed[] = [
  {
    category: 'repair',
    createdAt: SEEDED_AT,
    description: 'Вода стоит под лестницей уже третий день.',
    id: 'e2e-leak',
    number: 118,
    status: 'new',
    title: 'Протечка воды в подвале',
  },
  {
    category: 'replacement',
    createdAt: SEEDED_AT - 1000,
    description: 'Лампа не горит с прошлой недели.',
    id: 'e2e-lamp',
    number: 117,
    status: 'in-progress',
    title: 'Не работает лампа у входа',
  },
]

const seedIssue = ({
  category,
  createdAt,
  description,
  id,
  number,
  status,
  title,
}: IssueSeed) =>
  fake.seed(`issues/${id}`, {
    ...neighbour,
    category,
    commentCount: 0,
    createdAt: Timestamp.fromMillis(createdAt),
    description,
    keywords: keywordsOf(title, String(number)),
    lang: 'ru',
    media: [],
    number,
    reactions: {},
    status,
    tags: [],
    urgent: false,
  })

type ContactSeed = {
  name: string
  order: number
  phone: string
  role: string
}

const contacts: ContactSeed[] = [
  {
    name: 'Айгуль Смагулова',
    order: 1,
    phone: '+7 701 000 11 22',
    role: 'Управляющая',
  },
  {
    name: 'Пётр Волков',
    order: 2,
    phone: '+7 701 000 33 44',
    role: 'Сантехник',
  },
]

const seedContact = (contact: ContactSeed) =>
  fake.seed(`service-contacts/contact-${contact.order}`, contact)

const seedAuthUser = ({ key }: ResidentSeed) =>
  authFake.seedUser(e2ePhones[key], e2eUid(key))

export const seedE2eFixtures = (): void => {
  fake.reset()
  authFake.reset()
  residents.forEach(seedResident)
  residents.forEach(seedAuthUser)
  posts.forEach(seedPost)
  issues.forEach(seedIssue)
  contacts.forEach(seedContact)
  fake.seed('counters/issues', { value: 118 })
}
