import { useLingui } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { isNotFoundError, useTRPC } from '@/shared/api'
import { showToastMessage } from '@/shared/toast'

export const useIssueQuery = (issueId: string) => {
  const { t } = useLingui()
  const trpc = useTRPC()
  const navigate = useNavigate()
  const { data, error, isPending } = useQuery(
    trpc.issues.get.queryOptions({ issueId }, { retry: false }),
  )

  useEffect(() => {
    if (!isNotFoundError(error)) return
    navigate({ search: { status: 'new' }, to: '/issues' })
    showToastMessage({ kind: 'error', text: t`Заявка не найдена.` })
  }, [error, navigate, t])

  return { isLoading: isPending, issue: data }
}
