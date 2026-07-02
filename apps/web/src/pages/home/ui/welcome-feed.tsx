import { useLingui } from '@lingui/react/macro'
import { AnnounceCard, HeroCard } from '@raiymbek-park/ui'
import { useState } from 'react'

import { useEventsData } from '../model/use-events-data'
import { useProfileData } from '../model/use-profile-data'
import css from './welcome-feed.module.scss'

const greetCount = 4

export const WelcomeFeed = () => {
  const { t } = useLingui()
  const [messageIndex] = useState(() => Math.floor(Math.random() * greetCount))
  const { data: profile } = useProfileData()
  const { data: changes, isError, isLoading, isSuccess } = useEventsData()

  const name = profile?.name
  const hasChanges = !!changes?.length
  const isEmpty = isSuccess && !hasChanges
  const greeting = name ? t`Привет, ${name}! 👋` : t`Привет! 👋`

  const greetMessages = [
    t`Пока вас не было, ничего не произошло.`,
    t`За время вашего отсутствия всё было спокойно — новостей нет.`,
    t`Новых событий пока нет.`,
    t`Хорошие новости: пока вас не было, ничего важного не произошло.`,
  ]

  return (
    <HeroCard title={greeting}>
      {hasChanges && t`За время вашего отсутствия появились изменения:`}
      {isLoading && t`Загрузка последних событий…`}
      {isError && t`Не удалось загрузить последние события`}
      {isEmpty && greetMessages[messageIndex]}
      {hasChanges && (
        <ul className={css.changes}>
          {changes?.map(change => (
            <li key={change.id}>
              <AnnounceCard
                glyph={change.glyph}
                text={change.text}
                tone={change.tone}
              />
            </li>
          ))}
        </ul>
      )}
    </HeroCard>
  )
}
