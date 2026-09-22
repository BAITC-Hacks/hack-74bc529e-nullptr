# Repository Guidelines

## Project Structure & Module Organization

This is a Bun-based TanStack Start/React application running on Cloudflare Workers.

- `src/routes/`: file-based pages and API handlers; dynamic segments use `$id`.
- `src/components/`: React UI components.
- `src/lib/`: validation, authentication, AI, and storage helpers; server-only modules use `.server.ts`.
- `src/db/` and `drizzle/`: Drizzle schema, SQL migrations, and migration metadata.
- `tests/`: Bun tests; `scripts/`: deployment validation and smoke checks.
- `public/`: static assets; `docs/images/`: documentation images.

Treat `src/routeTree.gen.ts` and `worker-configuration.d.ts` as generated files.

## Build, Test, and Development Commands

Use the pinned Bun version (`bun@1.4.0`).

- `bun install --frozen-lockfile`: install dependencies reproducibly.
- Copy `.env.example` to `.env` and `.dev.vars.example` to `.dev.vars`; configure Clerk and OpenAI credentials locally.
- `bun run db:migrate`: apply local D1 migrations.
- `bun run dev`: start development at `http://localhost:3000`.
- `bun run build` / `bun run preview`: build and preview the application.
- `bun run check`: generate binding types, build, typecheck, test, and check formatting.
- `bun run format`: apply Prettier formatting.
- `bun run test:smoke`: check a running application; override its URL with `SMOKE_URL`.

## Coding Style & Naming Conventions

Use TypeScript and ES modules, two-space indentation, single quotes, no semicolons, and trailing commas, following Prettier. Use kebab-case filenames (`chat-panel.tsx`), PascalCase React components, and camelCase functions and variables. Follow TanStack route naming conventions. Keep secret and binding access in server-only modules.

## Testing Guidelines

Use `bun:test` in `tests/*.test.ts`, with behavior-based names. Run `bun run test` or `bun test tests/chat.test.ts`. Miniflare tests use disposable storage and synthetic identities. Cover changed behavior, invalid input, ownership, and authorization. No coverage threshold is configured. Verify live Clerk and provider behavior separately.

## Commit & Pull Request Guidelines

Prefer scoped Conventional Commits, as used in history: `feat(chat): add curated model selection`. PRs should explain changes, list verification, and include UI screenshots. Run `bun run check` before review.

## Task Tracking

Use GitHub Issues as the single backlog. Keep issues short: outcome, acceptance criteria, and blockers. Search existing issues before creating one. Track meaningful features and bugs; small fixes need no separate issue. Link PRs with `Closes #<number>` when they resolve an issue. Avoid duplicate Linear tracking and mandatory planning ceremonies; prioritize a working, verified demo.

## Security & Configuration

Never commit credentials or expose secrets through `VITE_` variables. Preserve per-user ownership checks and explicit paid-AI approval. Commit generated migrations and metadata together. Production deployment applies remote migrations; distinguish it from local checks and dry runs.
