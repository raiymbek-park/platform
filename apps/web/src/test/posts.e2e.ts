import { residents } from './support/residents'
import { signIn } from './support/sign-in'

Feature('Posts')

Scenario(
  'a resident filters the feed and publishes an offer @happy',
  ({ I }) => {
    signIn(I, residents.posts)
    I.click('Объявления')

    I.waitForText('Новостная лента и частные объявления от жильцов.', 10)
    I.waitForText('Плановое отключение воды', 10)
    I.click('Частные объявления')
    I.waitForText('Продам горный велосипед', 10)
    I.dontSee('Плановое отключение воды')

    I.click({ css: 'a[aria-label="Новое объявление"] span' })
    I.waitForText('Разместите частное объявление для жителей нашего ЖК.', 10)
    I.click('Услуги')
    I.fillField('Заголовок', 'Ремонт бытовой техники')
    I.fillField('Описание', 'Чиню стиральные и посудомоечные машины.')
    I.click('Опубликовать')

    I.waitForText('Объявление опубликовано.', 20)
    I.waitForText('Ремонт бытовой техники', 20)
  },
)
