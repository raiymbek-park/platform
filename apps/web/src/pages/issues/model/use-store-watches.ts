import { create } from 'zustand'

type WatchesState = {
  watches: Record<string, boolean>
  apply: (id: string, isWatching: boolean) => void
  clear: (id: string, isWatching: boolean) => void
}

const without = (record: Record<string, boolean>, key: string) => {
  const next = { ...record }
  delete next[key]
  return next
}

export const useStoreWatches = create<WatchesState>()(set => ({
  watches: {},
  apply: (id, isWatching) =>
    set(state => ({ watches: { ...state.watches, [id]: isWatching } })),
  clear: (id, isWatching) =>
    set(state =>
      state.watches[id] === isWatching
        ? { watches: without(state.watches, id) }
        : state,
    ),
}))
