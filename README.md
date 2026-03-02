# Base NX Monorepo — Angular + NgRx

A production-ready base project for developing scalable Angular applications using modern standards. Use this as a starting point for your own project.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Angular | 21.x |
| State Management | NgRx | 21.x |
| Monorepo | Nx | 22.x |
| Testing | Jest + Spectator | 30.x / 22.x |
| Styling | Tailwind CSS + SCSS | 4.x |
| Language | TypeScript | 5.9.x |
| Linting | ESLint + Prettier | 9.x / 3.x |

---

## Project Structure

```
base-angular-monorepo/
│
├── apps/                                   # Application entry points
│   └── efut-landing-page-app/                          # Main Angular application
│       ├── src/
│       │   ├── app/
│       │   │   ├── core/                   # Core services and global state
│       │   │   │   ├── +state/             # NgRx router state
│       │   │   │   │   ├── index.ts
│       │   │   │   │   └── router/
│       │   │   │   │       └── router.selectors.ts
│       │   │   │   └── services/
│       │   │   │       └── router/
│       │   │   │           └── router-serializer.ts
│       │   │   ├── pages/                  # Route-level page components
│       │   │   │   ├── home/
│       │   │   │   │   ├── home.ts
│       │   │   │   │   ├── home.html
│       │   │   │   │   └── home.scss
│       │   │   │   └── pages.routes.ts
│       │   │   ├── app.config.ts           # Application providers setup
│       │   │   ├── app.routes.ts           # Root routing configuration
│       │   │   ├── app.ts                  # Root component
│       │   │   ├── app.html
│       │   │   └── app.scss
│       │   ├── main.ts                     # Bootstrap entry point
│       │   ├── index.html
│       │   └── styles.scss                 # Global styles
│       ├── project.json                    # Nx project configuration
│       ├── jest.config.ts
│       └── eslint.config.mjs
│
├── libs/                                   # Shared libraries
│   │
│   ├── environment/                        # Environment configuration
│   │   └── src/lib/
│   │       ├── environment.ts              # Base environment interface
│   │       ├── environment.development.ts  # Development config
│   │       ├── environment.local.ts        # Local config
│   │       └── genai.paths.ts              # Application route paths
│   │
│   ├── profile/                            # Profile feature library
│   │   └── src/lib/
│   │       ├── +state/profile/             # NgRx state slice
│   │       │   ├── profile.actions.ts
│   │       │   ├── profile.effects.ts
│   │       │   ├── profile.reducer.ts
│   │       │   └── profile.selectors.ts
│   │       ├── molecules/                  # Compound components (Atomic Design)
│   │       │   └── user-info/
│   │       ├── pages/                      # Profile page and routing
│   │       │   ├── profile/
│   │       │   └── user.routes.ts
│   │       └── services/profile/           # Profile business logic
│   │           └── profile.service.ts
│   │
│   └── shared/                             # Cross-cutting shared libraries
│       │
│       ├── entity/                         # Data models and interfaces
│       │   └── src/lib/entity/
│       │       ├── error/
│       │       │   └── error.model.ts
│       │       ├── router-state/
│       │       │   └── router-state-url.model.ts
│       │       └── user/
│       │           └── user.model.ts
│       │
│       ├── store/                          # Shared NgRx state (cross-feature)
│       │   └── src/lib/+state/shared-data/
│       │       ├── shared-data.actions.ts
│       │       ├── shared-data.reducer.ts
│       │       └── shared-data.selectors.ts
│       │
│       └── ui/                             # Reusable UI components (Atomic Design)
│           └── src/lib/
│               └── header/
│                   ├── header.ts
│                   ├── header.html
│                   └── header.scss
│
├── docs/                                   # Project documentation
│   ├── best-practices.md                   # Angular coding standards and patterns
│   ├── workspace-generators.md             # Nx generator commands reference
│   └── skills/                             # Development guides for Claude Code
│       ├── feature-lib.md                  # How to create a feature library end-to-end
│       ├── lazy-loading.md                 # Lazy loading rules and common mistakes
│       ├── ngrx-state.md                   # NgRx state slice pattern
│       ├── angular-component.md            # Modern Angular component patterns
│       ├── unit-testing.md                 # Jest + Spectator testing patterns
│       └── module-boundaries.md            # Nx tags, ESLint boundary rules, registration steps
│
├── .github/
│   └── workflows/
│       └── ci.yml                          # CI/CD pipeline
│
├── .vscode/
│   └── extensions.json                     # Recommended VS Code extensions
│
├── nx.json                                 # Nx workspace configuration
├── tsconfig.base.json                      # Shared TypeScript paths and config
├── eslint.base.config.mjs                  # Shared ESLint rules
├── jest.config.ts                          # Root Jest configuration
├── jest.preset.js                          # Shared Jest preset
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10

### Install dependencies

```sh
npm install
```

### Run the application

```sh
npx nx serve efut-landing-page-app
```

### Run tests

```sh
# Single project
npx nx test efut-landing-page-app

# All projects
npx nx run-many --target=test --all
```

### Lint

```sh
npx nx run-many --target=lint --all
```

---

## Generating New Apps and Libraries

### New application

```sh
npx nx g @nx/angular:app apps/<app-name>
```

### New library

```sh
# Shared UI components
npx nx g @nx/angular:library libs/shared/ui --tags=ui --style=scss

# Shared data models
npx nx g @nx/angular:library libs/shared/entity --tags=entity --style=scss

# Feature library
npx nx g @nx/angular:library libs/<feature-name> --tags=feature --style=scss

# Shared NgRx store
npx nx g @nx/angular:library libs/shared/store --tags=shared-store

# Translations
npx nx g @nx/angular:library libs/shared/translation --tags=translation
```

> After creating a library, register it in `eslint.base.config.mjs` under `depConstraints` to enforce dependency boundaries.

---

## Architecture

### Library Tags and Dependency Rules

| Tag | Purpose |
|---|---|
| `ui` | Presentational components only, no business logic |
| `entity` | Data models and interfaces |
| `feature` | Feature-specific pages, state, and services |
| `shared-store` | Global NgRx state shared across features |

### Atomic Design (component organization)

```
atoms/       → Basic reusable elements (buttons, inputs)
molecules/   → Combinations of atoms (user-info card)
organisms/   → Complete structures (header, sidebar)
pages/       → Route-level components
```

### NgRx State Pattern

Each feature library manages its own state slice under `+state/<feature>/`:

```
+state/
└── <feature>/
    ├── <feature>.actions.ts
    ├── <feature>.effects.ts
    ├── <feature>.reducer.ts
    └── <feature>.selectors.ts
```

---

## Code Standards

This project enforces **modern Angular** patterns. See [`docs/best-practices.md`](.agents/skills/frontend-specialist/references/best-practices.md) for the full guide.

Key rules:

- Use `@if` / `@for` — never `*ngIf` / `*ngFor`
- Use `input()` / `output()` functions — never `@Input` / `@Output` decorators
- Use standalone components — no NgModules unless required by NgRx
- Use signals and reactive patterns over imperative code

---

## npm Scripts

| Command | Description |
|---|---|
| `npm start` | Serve the application |
| `npm test` | Run tests |
| `npm run test:all` | Run all project tests |
| `npm run lint:all` | Lint all projects |

---

## Documentation

- [`docs/best-practices.md`](.agents/skills/frontend-specialist/references/best-practices.md) — Angular and project coding standards
- [`docs/workspace-generators.md`](.agents/skills/frontend-specialist/references/workspace-generators.md) — Nx generator reference

### Development Skills (Claude Code)

Step-by-step guides for developing correctly in this project:

| Skill | Description |
|---|---|
| [`docs/skills/feature-lib.md`](.agents/skills/frontend-specialist/references/feature-lib.md) | Creating a complete feature library (uses `libs/profile` as reference) |
| [`docs/skills/lazy-loading.md`](.agents/skills/frontend-specialist/references/lazy-loading.md) | Lazy loading rules — what to export, how to wire routes, common mistakes |
| [`docs/skills/ngrx-state.md`](.agents/skills/frontend-specialist/references/ngrx-state.md) | NgRx state slice pattern — actions, reducer, selectors, effects, module |
| [`docs/skills/angular-component.md`](.agents/skills/frontend-specialist/references/angular-component.md) | Modern Angular component patterns — signals, input/output, control flow |
| [`docs/skills/unit-testing.md`](.agents/skills/frontend-specialist/references/unit-testing.md) | Unit testing with Jest and Spectator — components, services, effects, reducers |
