// E2E smoke for the critical auth happy path: register → phone code → home.
// Runtime requirements:
//  - api server on :3001 with OTP_TEST_MODE=true in apps/api/.env — otp.send
//    honors the test-code map (+7 705 226 6666 → 123456) and skips smsc.kz
//  - Firebase Auth emulator on :9099 (firebase emulators:start) — otp.verify
//    mints the custom token against it when the api runs with
//    FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099, and the web signs in against
//    it via VITE_AUTH_EMULATOR=127.0.0.1:9099, so no service account is needed
//    locally (CI still gates on lint/typecheck/unit only)
// Run with both servers up: `npm run test:e2e`.

Feature('Onboarding')

Scenario(
  'a resident registers with a phone code and reaches home @happy',
  ({ I }) => {
    I.amOnPage('/onboarding/')
    I.waitForText('Выберите язык', 10)
    I.click('Далее')

    I.waitForText('Добро пожаловать!', 10)
    I.click('Выбрать')

    I.waitForText('Имя', 10)
    I.fillField('Имя', 'Тест Тестов')
    I.fillField('Телефон', '87781234455')
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
