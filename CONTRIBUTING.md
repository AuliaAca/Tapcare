# Contributing

Thanks for helping make kiosks less intimidating. The full team standard is in [`docs/CODE_QUALITY_CHECKLIST.md`](docs/CODE_QUALITY_CHECKLIST.md). This page is the short version.

## Setup

```bash
nvm use            # Node 22.9+
npm install        # also installs Git hooks (Husky)
npm run dev
```

## Workflow

1. Create a branch from `main` named `<type>/<issue>-<short-description>`, for example `feat/42-voice-input`.
2. Commit using [Conventional Commits](https://www.conventionalcommits.org/), for example `fix(web): stop camera when leaving the screen`. A `commit-msg` hook checks the format.
3. Run `npm run check` before pushing. It runs the same gates as CI.
4. Open a PR using the template. Keep it small and focused, and include screenshots for UI changes.
5. Squash-merge once CI is green and a reviewer has approved.

## Standards at a glance

- TypeScript strict mode. ESLint must report zero warnings, and Prettier formats every file.
- New logic needs unit tests. User flows need integration or e2e tests. Coverage must stay at or above 80% for lines and 70% for branches.
- Validate every external input with the Zod schemas in `packages/shared`.
- Never log camera frames, keys or personal data. Never use `console.*`; use the server logger.
- Add every UI string to **both** `apps/web/src/i18n/id.ts` and `en.ts`.
- Keep accessibility in mind: touch targets of at least 56px, labels for screen readers, and layouts that still work at the "Extra large" text size.

## Adding a practice scenario

Add an entry to `apps/web/src/practice/scenarios.ts`. Each screen needs exactly one button with `correct: true`, and a test checks this. No component changes are needed.

## Adding an AI provider

Implement `GuidanceProvider` in `apps/server/src/providers/` and register it in `factory.ts`. The service layer applies the same safety rules to every provider.
