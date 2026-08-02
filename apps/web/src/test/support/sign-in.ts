import type { Persona } from './residents'

const TEST_CODE = '123456'

export const chooseLanguage = (
  I: CodeceptJS.I,
  language: string,
  next: string,
): void => {
  I.amOnPage('/onboarding/')
  I.waitForText('Выберите язык', 10)
  I.click(language)
  I.click(next)
}

export const submitPhone = (I: CodeceptJS.I, persona: Persona): void => {
  I.waitForText('Добро пожаловать!', 10)
  I.click('Выбрать')
  I.waitForText('Имя', 10)
  I.fillField('Имя', persona.name)
  I.fillField('Телефон', persona.phone)
  I.click(`Блок ${persona.block}`)
  I.fillField('Номер квартиры', persona.apartment)
  I.click('Собственник квартиры')
  I.click('Далее')
}

export const enterCode = (I: CodeceptJS.I): void => {
  I.waitForText('Введите код из SMS', 20)
  I.click('(//input)[1]')
  I.type(TEST_CODE)
}

export const signIn = (I: CodeceptJS.I, persona: Persona): void => {
  chooseLanguage(I, 'Русский', 'Далее')
  submitPhone(I, persona)
  enterCode(I)
  I.waitForText(`Привет, ${persona.name}!`, 20)
}
