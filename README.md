# fe-interview-prep

Five React + TypeScript interview exercises. Each question lives on its own route and was shipped as
its own pull request into `main`.

## Questions

| #   | Question                                    | PR Link                                                        |
| --- | ------------------------------------------- | -------------------------------------------------------------- |
| 1   | Shopping cart (`/cart`)                     | [#4](https://github.com/aryan-edstem/fe-interview-prep/pull/4) |
| 2   | Infinite feed (`/feed`)                     | [#3](https://github.com/aryan-edstem/fe-interview-prep/pull/3) |
| 3   | Kanban board (`/kanban`)                    | [#6](https://github.com/aryan-edstem/fe-interview-prep/pull/6) |
| 4   | Live dashboard (`/dashboard`)               | [#7](https://github.com/aryan-edstem/fe-interview-prep/pull/7) |
| 5   | Comments with offline support (`/comments`) | [#5](https://github.com/aryan-edstem/fe-interview-prep/pull/5) |

## Stack

Vite, React 19, TypeScript (strict), Tailwind CSS v4, React Router, ESLint (typescript-eslint +
react-hooks), Prettier, Vitest + React Testing Library + user-event, Husky + lint-staged, Playwright
(screenshots only).

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

| Command                   | What it does                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm lint`               | ESLint, zero warnings                                                                       |
| `pnpm typecheck`          | TypeScript project build check                                                              |
| `pnpm test`               | Vitest unit/component tests                                                                 |
| `pnpm build`              | Production build                                                                            |
| `pnpm screenshots <slug>` | Capture `/<slug>` to `docs/screenshots/` (run `pnpm exec playwright install chromium` once) |

## Project layout

```
src/
  app/            router + route tree
  components/     shared UI (layout)
  pages/          home, not-found
  questions/
    registry.ts   auto-discovers every question folder
    q1-cart/      meta.ts + Page.tsx (+ components/, hooks/, tests)
  test/           test setup + renderRoute helper
docs/
  questions/      requirements for each question
  screenshots/    PR screenshots
```

Adding `src/questions/<id>/meta.ts` and `Page.tsx` registers the route and nav link automatically.

## Workflow

Each question: branch `feature/q<N>-<slug>` from the latest `main` -> small, meaningful commits ->
PR into `main` using the repo's PR template (Problem, Approach, Decisions & trade-offs, Screenshots,
How to test) -> CI green -> merge.
