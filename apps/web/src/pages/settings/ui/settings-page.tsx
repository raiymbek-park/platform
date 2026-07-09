import { useLingui } from '@lingui/react/macro'
import { Content, EmptyState, ScreenHeader } from '@raiymbek-park/ui'

import { BottomNav } from '@/widgets/bottom-nav'

import { useProfileData } from '../model/use-profile-data'
import { ProfileForm } from './profile-form'

const errorImage = `${import.meta.env.BASE_URL}images/no-data.png`

export const SettingsPage = () => {
  const { t } = useLingui()
  const { data, isError } = useProfileData()

  return (
    <>
      <ScreenHeader />
      <Content>
        {isError && (
          <EmptyState
            image={errorImage}
            message={t`Не удалось загрузить профиль. Попробуйте позже.`}
            title={t`Что-то пошло не так`}
          />
        )}
        {!isError && data && <ProfileForm profile={data} />}
      </Content>
      <BottomNav active='/settings' />
    </>
  )
}
