// E2E smoke for the critical auth happy path: register → phone code → home.
// Runtime requirements:
//  - api server on :3001 (vite proxies /trpc → :3001 for the register call)
//  - the Firebase test number +7 705 226 6666 with fixed code 123456 (Firebase console)
// Run with both servers up: `npm run test:e2e`.

Feature('Onboarding')

Scenario(
  'a resident registers with a phone code and reaches home @happy',
  ({ I }) => {
    I.amOnPage('/onboarding/welcome')
    I.see('Добро пожаловать!')

    I.fillField('Имя', 'Тест Тестов')
    I.fillField('Телефон', '87052266666')
    I.click('Блок 1')
    I.fillField('Номер квартиры', '42')
    I.click('Собственник квартиры')
    I.click('Далее')

    I.waitForText('Введите код из SMS', 20)
    I.click('input')
    I.type('123456')

    I.waitForText('Привет', 20)
  },
)
