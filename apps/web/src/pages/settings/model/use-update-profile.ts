import type { Role } from '@raiymbek-park/shared/validation-schemas'

import { useLingui } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { trpcClient, useTRPC } from '@/shared/api'
import { auth } from '@/shared/firebase'
import { uploadAvatar } from '@/shared/media'
import { showToastMessage } from '@/shared/toast'

type UpdateProfileVariables = {
  apartment: number
  avatarFile: File | null
  avatarUrl: string | null
  block: number
  cars: string[]
  isPhoneVisible: boolean
  name: string
  role: Role
}

const resolveAvatarUrl = async (
  file: File | null,
  currentUrl: string | null,
) => {
  if (!file) return currentUrl
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('unauthenticated')
  const { failedCount, urls } = await uploadAvatar(uid, file)
  const [url] = urls
  if (failedCount > 0 || !url) throw new Error('avatar-upload-failed')
  return url
}

export const useUpdateProfile = () => {
  const { t } = useLingui()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      avatarFile,
      avatarUrl,
      ...profile
    }: UpdateProfileVariables) => {
      const resolvedUrl = await resolveAvatarUrl(avatarFile, avatarUrl)
      await trpcClient.resident.update.mutate({
        ...profile,
        avatarUrl: resolvedUrl,
      })
      return resolvedUrl
    },
    onError: () =>
      showToastMessage({
        kind: 'error',
        text: t`Не удалось сохранить профиль. Попробуйте ещё раз.`,
      }),
    onSuccess: () =>
      showToastMessage({ kind: 'success', text: t`Профиль сохранён.` }),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: trpc.resident.me.queryKey(),
        refetchType: 'all',
      }),
  })
}
