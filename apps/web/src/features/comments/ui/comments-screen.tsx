import type { Comment } from '@raiymbek-park/api'
import type { CommentParent } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { ScreenHeader } from '@raiymbek-park/ui'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { showToastMessage } from '@/shared/toast'

import { useCommentAccess } from '../model/use-comment-access'
import { useDeleteComment } from '../model/use-delete-comment'
import { useParentTitle } from '../model/use-parent-title'
import { CommentActionsSheet } from './comment-actions-sheet'
import { CommentDeleteConfirm } from './comment-delete-confirm'
import { CommentInputBar } from './comment-input-bar'
import { CommentThread } from './comment-thread'
import css from './comments-screen.module.scss'

export type CommentsScreenProps = {
  parent: CommentParent
  parentId: string
}

export const CommentsScreen = ({ parent, parentId }: CommentsScreenProps) => {
  const { t } = useLingui()
  const router = useRouter()
  const target = { parent, parentId }
  const access = useCommentAccess()
  const title = useParentTitle(target)
  const { deleteComment, isPending: isDeleting } = useDeleteComment(target)

  const [editing, setEditing] = useState<Comment | null>(null)
  const [actionsFor, setActionsFor] = useState<Comment | null>(null)
  const [deleting, setDeleting] = useState<Comment | null>(null)
  const [scrollSignal, setScrollSignal] = useState(0)

  const canAct = (comment: Comment) =>
    access.canEdit(comment) || access.canDelete(comment)

  const startEdit = () => {
    setEditing(actionsFor)
    setActionsFor(null)
  }

  const startDelete = () => {
    setDeleting(actionsFor)
    setActionsFor(null)
  }

  const confirmDelete = () => {
    if (!deleting) return
    deleteComment(deleting.id, {
      onFailure: () => {
        setDeleting(null)
        showToastMessage({
          kind: 'error',
          text: t`Не удалось удалить сообщение. Попробуйте ещё раз.`,
        })
      },
      onSuccess: () => {
        setDeleting(null)
        showToastMessage({ kind: 'success', text: t`Сообщение удалено.` })
      },
    })
  }

  return (
    <section className={css.screen}>
      <ScreenHeader
        backLabel={t`Назад`}
        title={title ?? t`Комментарии`}
        onBack={() => router.history.back()}
      />
      <CommentThread
        canAct={canAct}
        scrollSignal={scrollSignal}
        target={target}
        onActions={setActionsFor}
      />
      {access.canWrite && (
        <CommentInputBar
          editing={editing}
          target={target}
          onDoneEditing={() => setEditing(null)}
          onSent={() => setScrollSignal(signal => signal + 1)}
        />
      )}
      <CommentActionsSheet
        canEdit={actionsFor !== null && access.canEdit(actionsFor)}
        isOpen={actionsFor !== null}
        onClose={() => setActionsFor(null)}
        onDelete={startDelete}
        onEdit={startEdit}
      />
      <CommentDeleteConfirm
        isLoading={isDeleting}
        isOpen={deleting !== null}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </section>
  )
}
