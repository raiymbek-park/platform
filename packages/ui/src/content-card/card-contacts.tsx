import type { ReactNode } from 'react'
import type { IconGlyph } from '../icon'

import { Icon } from '../icon'
import css from './content-card.module.scss'

export type ContentCardContact = {
  glyph: IconGlyph
  isAction?: boolean
  isEmphasis?: boolean
  text: ReactNode
}

const contactClass = (contact: ContentCardContact) => {
  if (contact.isAction) return css.contactAction
  if (contact.isEmphasis) return css.contactName
  return css.contactText
}

export type CardContactsProps = {
  contacts: ContentCardContact[]
}

export const CardContacts = ({ contacts }: CardContactsProps) => (
  <div className={css.contacts}>
    {contacts.map(contact => (
      <div key={contact.glyph} className={css.contact}>
        <Icon className={css.contactIcon} glyph={contact.glyph} size={16} />
        <span className={contactClass(contact)}>{contact.text}</span>
      </div>
    ))}
  </div>
)
