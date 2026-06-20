import css from './home-page.module.scss'

export const HomePage = () => (
  <section className={css.page}>
    <h1 className={css.title}>Привет, Азиза! 👋</h1>
    <p className={css.body}>Главный экран — скоро здесь появятся сервисы.</p>
  </section>
)
