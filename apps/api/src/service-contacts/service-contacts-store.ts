import type { Glyph, Tone } from '../shared/glyph-tone'

import { getDb } from '../firestore'
import { toGlyph, toText, toTone } from '../shared/glyph-tone'

export type ServiceContact = {
  glyph: Glyph
  id: string
  name: string
  order: number
  phone: string
  role: string
  tone: Tone
}

export const getServiceContacts = async (): Promise<ServiceContact[]> => {
  const snap = await getDb()
    .collection('serviceContacts')
    .orderBy('order', 'asc')
    .get()
  return snap.docs.map(doc => {
    const data = doc.data()
    return {
      glyph: toGlyph(data.glyph),
      id: doc.id,
      name: toText(data.name),
      order: typeof data.order === 'number' ? data.order : 0,
      phone: toText(data.phone),
      role: toText(data.role),
      tone: toTone(data.tone),
    }
  })
}
