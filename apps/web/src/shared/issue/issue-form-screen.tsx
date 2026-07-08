import type { ReactNode } from 'react'

import { Content, ScreenHeader } from '@raiymbek-park/ui'

import css from './issue-form-screen.module.scss'

type IssueFormScreenProps = {
  children: ReactNode
  illustration?: string
  onSubmit: () => void
}

export const IssueFormScreen = ({
  children,
  illustration,
  onSubmit,
}: IssueFormScreenProps) => (
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
