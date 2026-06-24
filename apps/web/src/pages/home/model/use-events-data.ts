import type { Event } from '@raiymbek-park/api'

import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/shared/api'

export type ChangeView = {
  glyph: Event['glyph']
  id: string
  text: string
  tone: Event['tone']
}

const toChangeView = (event: Event): ChangeView => ({
  glyph: event.glyph,
  id: event.id,
  text: event.text,
  tone: event.tone,
})

export const useEventsData = () => {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.events.list.queryOptions(),
    select: events => events.map(toChangeView),
  })
}
