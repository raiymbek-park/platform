import { ChangeRow, WelcomeCard } from '@raiymbek-park/ui'

import { useChangesData } from '../model/use-changes-data'
import { useProfileData } from '../model/use-profile-data'
import css from './welcome-feed.module.scss'

export const WelcomeFeed = () => {
  const { data: profile } = useProfileData()
  const { data: changes, isError, isLoading } = useChangesData()

  const greeting = profile ? `Привет, ${profile.name}! 👋` : 'Привет! 👋'
  const hasChanges = !!changes?.length

  return (
    <WelcomeCard
      description={
        hasChanges
          ? 'За время вашего отсутствия появились изменения:'
          : undefined
      }
      title={greeting}
    >
      {isLoading && <p className={css.state}>Загрузка изменений…</p>}
      {isError && <p className={css.state}>Не удалось загрузить изменения</p>}
      {hasChanges && (
        <ul className={css.changes}>
          {changes?.map(change => (
            <li key={change.id}>
              <ChangeRow
                glyph={change.glyph}
                text={change.text}
                tone={change.tone}
              />
            </li>
          ))}
        </ul>
      )}
    </WelcomeCard>
  )
}
