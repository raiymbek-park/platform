// E2E smoke for the critical auth happy path: register → phone code → home.
// Runtime requirements:
//  - api server on :3001 with OTP_TEST_MODE=true in apps/api/.env — otp.send
//    honors the test-code map (+7 705 226 6666 → 123456) and skips smsc.kz
//  - otp.verify runs the real path and mints a Firebase custom token; locally
//    the api's authorized_user credentials cannot sign custom tokens, so the
//    signed-in leg needs GOOGLE_APPLICATION_CREDENTIALS pointing at a service
//    account (known local limitation — CI gates on lint/typecheck/unit only)
// Run with both servers up: `npm run test:e2e`.

Feature('Onboarding')

Scenario(
  'a resident registers with a phone code and reaches home @happy',
  ({ I }) => {
    I.amOnPage('/onboarding/welcome')
    I.waitForText('Добро пожаловать!', 10)

    I.fillField('Имя', 'Тест Тестов')
    I.fillField('Телефон', '87052266666')
    I.click('Блок 1')
    I.fillField('Номер квартиры', '42')
    I.click('Собственник квартиры')
    I.click('Далее')

    I.waitForText('Введите код из SMS', 20)
    I.click('(//input)[1]')
    I.type('123456')

    I.waitForText('Привет', 20)
  },
)
