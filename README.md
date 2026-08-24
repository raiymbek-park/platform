<div align="center">

# Raiymbek Park

<img src="design/images/building.png" alt="Raiymbek Park" width="640" />

An app for residents of **Raiymbek Park** — announcements, maintenance requests,
and a fast line to the people who can help when something breaks.

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

## About

An online space for the residents and owners of the Raiymbek Park apartment
complex. It is home to the digital services that make day-to-day life in the
building easier and the way it is run clearer and more transparent.

Services:

- News and announcements for the complex — scheduled utility work and other
  events worth knowing about.
- Polls, meetings, and decisions residents make together.
- Requests to fix faults and report violations.
- Status and history of every request.
- A direct line to the on-duty maintenance staff.
- A building-wide chat.

## Layout

```
.
├── apps/
│   ├── web/        React SPA — FSD layers, TanStack Router, tRPC + TanStack Query
│   └── api/        tRPC server
├── packages/
│   ├── ui/         Design-system primitives
│   └── shared/     Framework-agnostic helpers
└── design/         .pen sources and image assets
```

## Getting started

```bash
# Node 20+ recommended
npm install

# copy and adjust the web env (tRPC endpoint, optional base path)
cp apps/web/.env.example apps/web/.env

# run web + api together (Turborepo)
npm run dev
```

The web app comes up on `http://localhost:5173`, the tRPC stub server on
`http://localhost:3001`.

## Conventions

- **Feature-Sliced Design** — the `app` / `pages` / `features` / `shared` layers
  (enforced by the Steiger linter: `npm run lint:fsd` in `apps/web`).
- **Files** in kebab-case, **components** in PascalCase, named exports.
- **Styles** through CSS modules and design tokens (`apps/web/src/app/tokens.scss`).
- **Tests** live next to the implementation; e2e sits in `apps/web/src/test`.

The full rules (code, HTML semantics, styling, state management) are in
`.claude/rules/`.
