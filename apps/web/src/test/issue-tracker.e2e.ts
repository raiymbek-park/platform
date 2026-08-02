import { residents } from './support/residents'
import { signIn } from './support/sign-in'

Feature('Issue tracker')

Scenario(
  'a resident opens an issue and finds it numbered in the list @happy',
  ({ I }) => {
    signIn(I, residents.issues)
    I.click('Заявки')

    I.waitForText('Обращения жильцов в управляющую компанию и их статусы.', 10)
    I.waitForText('Заявка №118 · Новая заявка', 10)

    I.click({ css: 'a[aria-label="Новая заявка"] span' })
    I.waitForText('Опишите проблему или вопрос', 10)
    I.click('Ремонт')
    I.fillField('Тема заявки', 'Не закрывается дверь подъезда')
    I.fillField('Описание', 'Дверь не защёлкивается, подъезд открыт всю ночь.')
    I.click('Отправить')

    I.waitForText('Заявка отправлена.', 20)
    I.waitForText('Заявка №119 · Новая заявка', 20)
    I.see('Дверь не защёлкивается, подъезд открыт всю ночь.')
  },
)
