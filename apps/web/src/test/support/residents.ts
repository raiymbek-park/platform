export type Persona = {
  apartment: string
  block: number
  name: string
  phone: string
}

export const residents = {
  home: { apartment: '42', block: 1, name: 'Алина Ким', phone: '87010000001' },
  issues: { apartment: '15', block: 1, name: 'Мария Ли', phone: '87010000003' },
  newcomer: {
    apartment: '77',
    block: 2,
    name: 'Тимур Абдулов',
    phone: '87010000004',
  },
  posts: {
    apartment: '23',
    block: 3,
    name: 'Данияр Сеит',
    phone: '87010000005',
  },
  profile: {
    apartment: '88',
    block: 2,
    name: 'Сауле Нур',
    phone: '87010000006',
  },
} satisfies Record<string, Persona>
