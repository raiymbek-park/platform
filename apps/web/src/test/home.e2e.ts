import { residents } from './support/residents'
import { signIn } from './support/sign-in'

const resident = residents.home

Feature('Home')

Scenario(
  'a resident sees their address, the latest changes, services and contacts @happy',
  ({ I }) => {
    signIn(I, resident)

    I.see(`Блок ${resident.block} · Квартира ${resident.apartment}`)
    I.waitForText('За время вашего отсутствия появились изменения:', 10)
    I.see('Плановое отключение воды')
    I.see('Сервисы')
    I.see('Аварийные контакты')
    I.see('Айгуль Смагулова')

    I.click('Объявления')

    I.waitForText('Новостная лента и частные объявления от жильцов.', 10)
  },
)
