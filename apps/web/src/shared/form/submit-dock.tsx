import type { IconGlyph } from '@raiymbek-park/ui'
import type { FunctionComponent, ReactNode } from 'react'

import { FormDock } from './form-dock'

type SubmitForm = {
  Subscribe: (props: {
    children: (canSubmit: boolean) => ReactNode
    selector: (state: { canSubmit: boolean }) => boolean
  }) => ReturnType<FunctionComponent>
}

export type SubmitDockProps = {
  backLabel?: string
  form: SubmitForm
  isPending: boolean
  submitIcon: IconGlyph
  submitLabel: ReactNode
  onBack: () => void
}

export const SubmitDock = ({
  backLabel,
  form,
  isPending,
  submitIcon,
  submitLabel,
  onBack,
}: SubmitDockProps) => (
  <form.Subscribe selector={state => state.canSubmit}>
    {canSubmit => (
      <FormDock
        backLabel={backLabel}
        canSubmit={canSubmit}
        isPending={isPending}
        submitIcon={submitIcon}
        submitLabel={submitLabel}
        onBack={onBack}
      />
    )}
  </form.Subscribe>
)
