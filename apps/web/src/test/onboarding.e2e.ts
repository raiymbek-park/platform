import { residents } from './support/residents'
import { chooseLanguage, enterCode, submitPhone } from './support/sign-in'

const newcomer = residents.newcomer

Feature('Onboarding')

Scenario(
  'a resident registers with a phone code and reaches home @happy',
  ({ I }) => {
    chooseLanguage(I, 'Русский', 'Далее')
    submitPhone(I, newcomer)
    enterCode(I)

    I.waitForText(`Привет, ${newcomer.name}!`, 20)
    I.see(`Блок ${newcomer.block} · Квартира ${newcomer.apartment}`)
  },
)
