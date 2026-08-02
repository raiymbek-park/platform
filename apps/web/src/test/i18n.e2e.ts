import { chooseLanguage } from './support/sign-in'

Feature('Interface language')

Scenario(
  'a resident picks English at first launch and keeps it after a reload @happy',
  ({ I }) => {
    chooseLanguage(I, 'English', 'Next')

    I.waitForText('Welcome!', 10)
    I.dontSee('Добро пожаловать!')
    I.seeAttributesOnElements('html', { lang: 'en' })

    I.refreshPage()

    I.waitForText('Welcome!', 10)
    I.seeAttributesOnElements('html', { lang: 'en' })
  },
)
