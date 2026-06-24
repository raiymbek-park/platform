import { ChangeRow, WelcomeCard } from '@raiymbek-park/ui'

import { useEventsData } from '../model/use-events-data'
import { useProfileData } from '../model/use-profile-data'
import css from './welcome-feed.module.scss'

const greetMessages = [
  'Пока вас не было, ничего не произошло.',
  'За время вашего отсутствия всё было спокойно — новостей нет.',
  'Новых событий пока нет.',
  'Хорошие новости: пока вас не было, ничего важного не произошло.',
]

const getMessage = () =>
  greetMessages[Math.floor(Math.random() * greetMessages.length)]

export const WelcomeFeed = () => {
  const { data: profile } = useProfileData()
  const { data: changes, isError, isLoading, isSuccess } = useEventsData()

  const name = profile?.name
  const hasChanges = !!changes?.length
  const isEmpty = isSuccess && !hasChanges
  const greeting = name ? `Привет, ${name}! 👋` : 'Привет! 👋'

  return (
    <WelcomeCard
      description={
        hasChanges
          ? 'За время вашего отсутствия появились изменения:'
          : undefined
      }
      title={greeting}
    >
      {isLoading && <p className={css.state}>Загрузка последних событий…</p>}
      {isError && (
        <p className={css.state}>Не удалось загрузить последние события.</p>
      )}
      {isEmpty && <p className={css.state}>{getMessage()}</p>}
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
