import type { ServiceContact } from '@raiymbek-park/api'

import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export type ContactView = {
  glyph: ServiceContact['glyph']
  id: string
  name: string
  phone: string
  role: string
  tone: ServiceContact['tone']
}

const toContactView = (contact: ServiceContact): ContactView => ({
  glyph: contact.glyph,
  id: contact.id,
  name: contact.name,
  phone: contact.phone,
  role: contact.role,
  tone: contact.tone,
})

export const useServiceContactsData = () => {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.serviceContacts.list.queryOptions(),
    select: contacts => contacts.map(toContactView),
  })
}
