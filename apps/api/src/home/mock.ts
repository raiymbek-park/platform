// Mocked home data. Glyph/tone literals are kept in sync with the web DS
// (IconGlyph / IconChipTone) by value so the inferred tRPC types assign to the
// UI props without the api package importing from @raiymbek-park/ui.
type Glyph =
  | 'megaphone'
  | 'clipboard-check'
  | 'droplet-off'
  | 'zap'
  | 'camera'
  | 'list-checks'
  | 'message-circle'
  | 'building-2'
  | 'shield'
  | 'droplets'

type Tone = 'brand' | 'danger' | 'accent' | 'info' | 'warning'

export type ResidentProfile = {
  apartment: number
  block: number
  name: string
}

export type ChangeItem = {
  glyph: Glyph
  id: string
  text: string
  tone: Tone
}

export type ServiceItem = {
  description: string
  glyph: Glyph
  id: string
  title: string
  tone: Tone
  url: string
}

export type ContactItem = {
  glyph: Glyph
  id: string
  name: string
  phone: string
  role: string
  tone: Tone
}

export const profile: ResidentProfile = {
  apartment: 142,
  block: 1,
  name: 'Азиза',
}

export const changes: ChangeItem[] = [
  {
    id: 'announcements',
    glyph: 'megaphone',
    text: '3 новых объявления от УК',
    tone: 'danger',
  },
  {
    id: 'request-done',
    glyph: 'clipboard-check',
    text: 'Заявка №142 выполнена',
    tone: 'brand',
  },
  {
    id: 'water-shutdown',
    glyph: 'droplet-off',
    text: 'Плановое отключение воды 20 июня',
    tone: 'info',
  },
]

export const services: ServiceItem[] = [
  {
    id: 'announcements',
    glyph: 'megaphone',
    title: 'Объявления',
    description: 'Новости и уведомления от УК',
    tone: 'danger',
    url: '/announcements',
  },
  {
    id: 'quick-request',
    glyph: 'zap',
    title: 'Быстрая заявка',
    description: 'Подать обращение без регистрации',
    tone: 'brand',
    url: 'https://forms.gle/TEQ88tykp8K2MjfQ9',
  },
  {
    id: 'media-request',
    glyph: 'camera',
    title: 'Заявка с медиа',
    description: 'Опишите проблему с фото или видео',
    tone: 'info',
    url: 'https://forms.gle/dPdJYfFpQic2r6YS8',
  },
  {
    id: 'request-status',
    glyph: 'list-checks',
    title: 'Статус заявки',
    description: 'Отслеживайте ход ваших обращений',
    tone: 'accent',
    url: 'https://trello.com/b/O9Sh7i6z',
  },
  {
    id: 'whatsapp-chat',
    glyph: 'message-circle',
    title: 'Чат дома в WhatsApp',
    description: 'Вступить в общий чат жильцов',
    tone: 'brand',
    url: 'https://chat.whatsapp.com/C9lxfazl3TH73LW7QtE2HI',
  },
]

export const contacts: ContactItem[] = [
  {
    id: 'management',
    glyph: 'building-2',
    name: 'Джонни Депп',
    role: 'Управление',
    phone: '+77011234567',
    tone: 'brand',
  },
  {
    id: 'security',
    glyph: 'shield',
    name: 'Джеки Чан',
    role: 'Охрана',
    phone: '+77017654321',
    tone: 'danger',
  },
  {
    id: 'electrician',
    glyph: 'zap',
    name: 'Сергей Сыроежкин',
    role: 'Электрик',
    phone: '+77012345678',
    tone: 'warning',
  },
  {
    id: 'plumber',
    glyph: 'droplets',
    name: 'Борат Сагдиев',
    role: 'Сантехник',
    phone: '+77018765432',
    tone: 'info',
  },
]
