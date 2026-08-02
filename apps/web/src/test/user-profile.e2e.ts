import { residents } from './support/residents'
import { signIn } from './support/sign-in'

const resident = residents.profile

Feature('User profile')

Scenario(
  'a resident renames their profile and the new name survives a reload @happy',
  ({ I }) => {
    signIn(I, resident)
    I.click('Настройки')

    I.waitForText('Видимость номера', 10)
    I.seeInField('Имя', resident.name)
    I.seeInField('Номер квартиры', resident.apartment)

    I.fillField('Имя', 'Сауле Нурланова')
    I.click('Сохранить')

    I.waitForText('Профиль сохранён.', 20)

    I.refreshPage()

    I.waitForText('Видимость номера', 20)
    I.seeInField('Имя', 'Сауле Нурланова')
  },
)
