import { Button } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'

import css from './welcome-page.module.scss'

export const WelcomePage = () => {
  const navigate = useNavigate()

  return (
    <section className={css.page}>
      <h1 className={css.title}>Добро пожаловать!</h1>
      <p className={css.body}>
        Личное пространство жильцов и собственников ЖК «Raiymbek Park».
      </p>
      <Button
        icon='arrow-right'
        iconPosition='right'
        onClick={() => navigate({ to: '/home' })}
      >
        Далее
      </Button>
    </section>
  )
}
