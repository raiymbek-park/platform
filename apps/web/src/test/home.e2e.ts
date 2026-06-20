Feature('Home')

Scenario('welcome screen navigates to home', ({ I }) => {
  I.amOnPage('/')
  I.see('Добро пожаловать!')
  I.click('Далее')
  I.see('Привет')
})
