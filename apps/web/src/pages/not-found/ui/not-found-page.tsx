import { Button, Content, HeroImage, ScreenHeader } from '@raiymbek-park/ui'
import { useNavigate } from '@tanstack/react-router'

import css from './not-found-page.module.scss'

export const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <>
      <ScreenHeader />
      <Content>
        <HeroImage src='images/not-found.png' />
        <div className={css.heading}>
          <h1 className={css.title}>Страница не найдена</h1>
          <p className={css.subtitle}>
            Запрашиваемая страница не существует или была перемещена. Проверьте
            адрес или вернитесь на главную.
          </p>
        </div>
        <div className={css.spacer} />
        <Button icon='house' onClick={() => navigate({ to: '/home' })}>
          На главную
        </Button>
      </Content>
    </>
  )
}
