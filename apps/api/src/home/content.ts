import type { Timestamp } from '../firestore'

import { getDb } from '../firestore'

const glyphs = [
  'megaphone',
  'clipboard-check',
  'droplet-off',
  'zap',
  'camera',
  'list-checks',
  'message-circle',
  'building-2',
  'shield',
  'droplets',
] as const

const tones = ['brand', 'danger', 'accent', 'info', 'warning'] as const

type Glyph = (typeof glyphs)[number]

type Tone = (typeof tones)[number]

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

export type ContactItem = {
  glyph: Glyph
  id: string
  name: string
  phone: string
  role: string
  tone: Tone
}

const string = (value: unknown): string =>
  typeof value === 'string' ? value : ''

const glyph = (value: unknown): Glyph =>
  glyphs.find(g => g === value) ?? 'megaphone'

const tone = (value: unknown): Tone => tones.find(t => t === value) ?? 'brand'

export const getChanges = async (
  lastVisit: Timestamp | null,
): Promise<ChangeItem[]> => {
  const events = getDb().collection('events')
  const scoped = lastVisit ? events.where('createdAt', '>', lastVisit) : events
  const snap = await scoped.orderBy('createdAt', 'desc').limit(10).get()
  return snap.docs.map(doc => {
    const data = doc.data()
    return {
      glyph: glyph(data.glyph),
      id: doc.id,
      text: string(data.text),
      tone: tone(data.tone),
    }
  })
}

export const getContacts = async (): Promise<ContactItem[]> => {
  const snap = await getDb()
    .collection('serviceContacts')
    .orderBy('order', 'asc')
    .get()
  return snap.docs.map(doc => {
    const data = doc.data()
    return {
      glyph: glyph(data.glyph),
      id: doc.id,
      name: string(data.name),
      phone: string(data.phone),
      role: string(data.role),
      tone: tone(data.tone),
    }
  })
}
