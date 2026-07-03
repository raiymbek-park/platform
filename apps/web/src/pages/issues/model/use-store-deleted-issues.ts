import { create } from 'zustand'

type DeletedIssuesState = {
  deletedIds: ReadonlySet<string>
  remove: (id: string) => void
  restore: (id: string) => void
}

const withId = (ids: ReadonlySet<string>, id: string) => new Set(ids).add(id)

const withoutId = (ids: ReadonlySet<string>, id: string) => {
  const next = new Set(ids)
  next.delete(id)
  return next
}

export const useStoreDeletedIssues = create<DeletedIssuesState>()(set => ({
  deletedIds: new Set(),
  remove: id => set(state => ({ deletedIds: withId(state.deletedIds, id) })),
  restore: id =>
    set(state => ({ deletedIds: withoutId(state.deletedIds, id) })),
}))
