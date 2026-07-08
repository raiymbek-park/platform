import type { ReactionKind } from '@raiymbek-park/shared/validation-schemas'

import { create } from 'zustand'

type Reaction = ReactionKind | null

type ReactionsState = {
  reactions: Record<string, Reaction>
  apply: (id: string, reaction: Reaction) => void
  clear: (id: string, reaction: Reaction) => void
}

const without = <T>(record: Record<string, T>, key: string) => {
  const next = { ...record }
  delete next[key]
  return next
}

export const createReactionsStore = () =>
  create<ReactionsState>()(set => ({
    reactions: {},
    apply: (id, reaction) =>
      set(state => ({ reactions: { ...state.reactions, [id]: reaction } })),
    clear: (id, reaction) =>
      set(state =>
        state.reactions[id] === reaction
          ? { reactions: without(state.reactions, id) }
          : {},
      ),
  }))
