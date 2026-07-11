import type { ServiceContact } from '@raiymbek-park/api'
import type { IconChipTone, IconGlyph } from '@raiymbek-park/ui'

import { useLingui } from '@lingui/react'
import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

import { resolveContactRole } from './contact-roles'

type ContactView = {
  glyph: IconGlyph
  id: string
  name: string
  phone: string
  role: string
  tone: IconChipTone
}

const toContactView = (contact: ServiceContact): ContactView => {
  const { glyph, label, tone } = resolveContactRole(contact.role)
  return {
    glyph,
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    role: label,
    tone,
  }
}

export const useServiceContactsData = () => {
  useLingui()
  const trpc = useTRPC()
  const query = useQuery(trpc.serviceContacts.list.queryOptions())
  return { ...query, data: query.data?.map(toContactView) }
}
