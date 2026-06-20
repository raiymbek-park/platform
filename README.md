<div align="center">

# Raiymbek Park

<img src="design/images/building.png" alt="Raiymbek Park" width="640" />

Приложение для жителей ЖК **Raiymbek Park** — объявления, заявки на ремонт и
быстрая связь с теми, кто поможет, когда что-то ломается.

<br />

![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-2.9-EF4444?logo=turborepo&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-2.5-60A5FA?logo=biome&logoColor=white)

![tRPC](https://img.shields.io/badge/tRPC-11-2596BE?logo=trpc&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&logoColor=white)
![TanStack Router](https://img.shields.io/badge/TanStack_Router-1-F97316)
![Zustand](https://img.shields.io/badge/Zustand-5-443E38)

![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)
![Stryker](https://img.shields.io/badge/Stryker-9-E74C3C)
![CodeceptJS](https://img.shields.io/badge/CodeceptJS-4-F6E05E?logoColor=black)
![Playwright](https://img.shields.io/badge/Playwright-1.61-2EAD33?logo=playwright&logoColor=white)

[![Fallow health](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/raiymbek-park/platform/badges/health-badge.json)](https://github.com/raiymbek-park/platform/actions/workflows/fallow.yml)

</div>

## О проекте

Онлайн-пространство для жильцов и собственников квартир ЖК «Raiymbek Park».
Здесь создаются и поддерживаются цифровые сервисы, которые делают повседневную
жизнь в доме удобнее, а управление им — понятнее и прозрачнее.

Сервисы:

- Новости и объявления по ЖК — плановые работы коммунальных служб и другие
  важные события.
- Голосования, собрания и принятие совместных решений жильцов.
- Заявки на устранение неполадок и нарушений.
- Статус и история обращений.
- Связь с дежурным техническим персоналом.
- Общий чат дома.

## Структура

```
.
├── apps/
│   ├── web/        React SPA — слои FSD, TanStack Router, tRPC + TanStack Query
│   └── api/        tRPC-сервер
├── packages/
│   ├── ui/         Примитивы дизайн-системы
│   └── shared/     Фреймворк-независимые хелперы
└── design/         Исходники .pen и графические ассеты
```

## Запуск

```bash
# рекомендуется Node 20+
npm install

# скопируй и поправь env веба (эндпоинт tRPC, опционально base-путь)
cp apps/web/.env.example apps/web/.env

# запустить web + api вместе (Turborepo)
npm run dev
```

Веб поднимается на `http://localhost:5173`, tRPC-сервер-заглушка — на
`http://localhost:3001`.

## Соглашения

- **Feature-Sliced Design** — слои `app` / `pages` / `features` / `shared`
  (проверяются линтером Steiger: `npm run lint:fsd` в `apps/web`).
- **Файлы** в kebab-case, **компоненты** в PascalCase, именованные экспорты.
- **Стили** через CSS-модули и дизайн-токены (`apps/web/src/app/tokens.scss`).
- **Тесты** рядом с реализацией; e2e — в `apps/web/src/test`.

Полные правила (код, HTML-семантика, стили, управление состоянием) — в
`.claude/rules/`.
