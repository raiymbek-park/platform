import { getDb } from '../firestore'
import { toText } from '../shared/glyph-tone'

export type ServiceContact = {
  id: string
  name: string
  order: number
  phone: string
  role: string
}

export const getServiceContacts = async (): Promise<ServiceContact[]> => {
  const snap = await getDb()
    .collection('service-contacts')
    .orderBy('order', 'asc')
    .get()
  return snap.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      name: toText(data.name),
      order: typeof data.order === 'number' ? data.order : 0,
      phone: toText(data.phone),
      role: toText(data.role),
    }
  })
}
