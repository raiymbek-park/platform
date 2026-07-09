import type { ReactNode } from 'react'

import { Content, ScreenHeader } from '@raiymbek-park/ui'

import css from './form-screen.module.scss'

type FormScreenProps = {
  children: ReactNode
  illustration?: string
  onSubmit: () => void
}

export const FormScreen = ({
  children,
  illustration,
  onSubmit,
}: FormScreenProps) => (
  <form
    className={css.form}
    onSubmit={event => {
      event.preventDefault()
      onSubmit()
    }}
  >
    <ScreenHeader />
    {illustration && (
      <img alt='' className={css.illustration} src={illustration} />
    )}
    <Content gap={24}>{children}</Content>
  </form>
)
