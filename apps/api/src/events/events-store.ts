import type { Glyph, Tone } from '../shared/glyph-tone'

import { getDb, Timestamp } from '../firestore'
import { toGlyph, toText, toTone } from '../shared/glyph-tone'

export type Event = {
  createdAt: number
  glyph: Glyph
  id: string
  kind: string
  text: string
  title: string
  tone: Tone
}

export const getEvents = async (
  lastVisit: Timestamp | null,
): Promise<Event[]> => {
  const events = getDb().collection('events')
  const scoped = lastVisit ? events.where('createdAt', '>', lastVisit) : events
  const snap = await scoped.orderBy('createdAt', 'desc').limit(10).get()
  return snap.docs.map(doc => {
    const data = doc.data()
    const createdAt =
      data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0
    return {
      createdAt,
      glyph: toGlyph(data.glyph),
      id: doc.id,
      kind: toText(data.kind),
      text: toText(data.text),
      title: toText(data.title),
      tone: toTone(data.tone),
    }
  })
}
