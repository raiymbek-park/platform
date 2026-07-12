import { create } from 'zustand'

type EditedComment = {
  editedAt: number
  media: string[]
  text: string
}

type EditedCommentsState = {
  edited: Record<string, EditedComment>
  apply: (id: string, value: EditedComment) => void
  clear: (id: string) => void
}

const without = (record: Record<string, EditedComment>, id: string) => {
  const next = { ...record }
  delete next[id]
  return next
}

export const useStoreEditedComments = create<EditedCommentsState>()(set => ({
  edited: {},
  apply: (id, value) =>
    set(state => ({ edited: { ...state.edited, [id]: value } })),
  clear: id => set(state => ({ edited: without(state.edited, id) })),
}))
