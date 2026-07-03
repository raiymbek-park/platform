import type { ReactionKind } from '@raiymbek-park/shared/validation-schemas'

import { create } from 'zustand'

type Reaction = ReactionKind | null

type ReactionsState = {
  reactions: Record<string, Reaction>
  apply: (issueId: string, reaction: Reaction) => void
  clear: (issueId: string, reaction: Reaction) => void
}

const without = <T>(record: Record<string, T>, key: string) => {
  const next = { ...record }
  delete next[key]
  return next
}

export const useStoreReactions = create<ReactionsState>()(set => ({
  reactions: {},
  apply: (issueId, reaction) =>
    set(state => ({ reactions: { ...state.reactions, [issueId]: reaction } })),
  clear: (issueId, reaction) =>
    set(state =>
      state.reactions[issueId] === reaction
        ? { reactions: without(state.reactions, issueId) }
        : {},
    ),
}))
