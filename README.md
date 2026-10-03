# TapCare

**See it. Understand it. Tap with confidence.**

You know what you want to do. You just don't know where to tap. TapCare is an agentic AI companion that uses your phone's camera to read an unfamiliar kiosk screen (train tickets, queue numbers, food ordering, parking) and guides you through it one tap at a time.

It is built for older adults and first-time users: large text, a voice that reads each step aloud, a calm practice mode, and safety rails around PINs, payments and scams.

## Features

|                           |                                                                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Live guidance**         | Point the camera at the kiosk and tap _Look at screen_. The AI picks **one** next tap, highlights it on the photo, and says it aloud.                                                                                           |
| **Agentic loop**          | After each tap the user reports back (_I tapped it_ / _I can't find it_ / _Nothing changed_). The agent checks progress on the next photo and re-plans when something goes wrong.                                               |
| **Safety rails**          | PIN, payment, personal-data and scam screens raise a banner. TapCare never reads or asks for a PIN. A suspicious screen stops the flow and sends the user to staff. Rules are enforced in server code as well as in the prompt. |
| **Practice mode**         | Three pretend kiosks (train ticket, clinic queue, food order with a PIN screen). They work offline and need no AI.                                                                                                              |
| **Accessible by default** | Large text by default with three sizes, slower speech, ≥ 56px touch targets, light/dark themes, screen-reader labels, reduced-motion support, and haptics. Checked with axe (WCAG 2 A/AA) in end-to-end tests.                  |
| **Bilingual**             | Bahasa Indonesia (default) and English, for both the UI and the spoken guidance.                                                                                                                                                |
| **Help button**           | Tips for asking staff, plus one-tap calling of a trusted contact stored only on the device.                                                                                                                                     |
| **Installable PWA**       | Add it to the home screen. The app shell and practice mode are cached for offline use.                                                                                                                                          |
| **Demo mode**             | Without an API key, a scripted provider stands in for the AI, so the whole app runs locally at no cost.                                                                                                                         |

## Tech stack

| Layer   | Choice                                                                                                                    | Why                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Web     | React 19, Vite 8, TypeScript, Tailwind CSS v4, Motion, Lucide                                                             | Fast mobile PWA with a modern, token-based design system                    |
| Server  | Node 22, Hono, Zod, Pino                                                                                                  | Small, typed API that keeps the AI key off the client, plus structured logs |
| AI      | Claude (`claude-opus-5-5`) via the official Anthropic SDK                                                                 | Vision, structured outputs, and a server-side refusal fallback              |
| Shared  | `@tapcare/shared` Zod schemas                                                                                             | One API contract, validated on both sides                                   |
| Quality | ESLint (typescript-eslint strict), Prettier, Vitest + Testing Library, Playwright + axe, Husky + lint-staged + commitlint | See [`docs/CODE_QUALITY_CHECKLIST.md`](docs/CODE_QUALITY_CHECKLIST.md)      |

## Quick start

Requirements: Node.js 22.9 or newer.

```bash
npm install
cp .env.example .env        # optional: add ANTHROPIC_API_KEY for real AI guidance
npm run dev                 # web on http://localhost:5173, API on http://localhost:8787
```

Without `ANTHROPIC_API_KEY` the server runs in **demo mode**: answers come from a fixed script, and the app shows a _Demo mode_ badge.

### Testing on a real phone

Browsers only allow camera access over HTTPS (or `localhost`). To test on a phone on the same Wi-Fi network:

```bash
npm run dev:phone           # serves https://<your-computer-ip>:5173 with a self-signed certificate
```

Open the printed _Network_ URL on the phone and accept the certificate warning.

## Scripts

| Command            | What it does                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `npm run dev`      | Web and API with hot reload                                                                               |
| `npm run build`    | Production build of web (`apps/web/dist`) and server (`apps/server/dist`)                                 |
| `npm start`        | Runs the built server. To serve the web app too, set `STATIC_DIR=../web/dist` (relative to `apps/server`) |
| `npm run check`    | Format check, lint, typecheck, and unit/integration tests with coverage: the same gate as CI              |
| `npm run test:e2e` | Playwright tests against the production build, with a fake camera and the demo provider                   |
| `npm run format`   | Formats every file with Prettier                                                                          |

## Project structure

```
apps/
  server/            Hono API: config, providers (Claude, mock), guidance service, middleware
  web/               React PWA: screens, components, hooks, i18n, practice scenarios
packages/
  shared/            Zod schemas: the API contract
e2e/                 Playwright end-to-end tests
docs/                Architecture, API reference, quality checklist, product notes
```

## Configuration

Copy [`.env.example`](.env.example) to `.env`. The server validates every variable at startup and refuses to start if one is invalid.

| Variable                | Default                                       | Notes                                                                                      |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `TAPCARE_PROVIDER`      | `auto`                                        | `auto` uses Claude when a key is set and the mock otherwise; `claude` or `mock` forces one |
| `ANTHROPIC_API_KEY`     | –                                             | Server-side only. Never expose it to the web app                                           |
| `TAPCARE_MODEL`         | `claude-opus-5-5`                             | Any vision-capable Claude model                                                            |
| `TAPCARE_EFFORT`        | `low`                                         | `low`, `medium` or `high`. Lower is faster; kiosk guidance is latency-sensitive            |
| `PORT`                  | `8787`                                        |                                                                                            |
| `ALLOWED_ORIGINS`       | `http://localhost:5173,http://localhost:4173` | CORS allow-list                                                                            |
| `RATE_LIMIT_PER_MINUTE` | `20`                                          | Per client, on `/api/guidance`                                                             |
| `TRUST_PROXY`           | `false`                                       | Set to `true` only behind a reverse proxy you control (reads `X-Forwarded-For`)            |
| `STATIC_DIR`            | –                                             | Serve the built web app from this folder                                                   |
| `LOG_LEVEL`             | `info`                                        | Pino log level                                                                             |

## Deployment

A multi-stage [`Dockerfile`](Dockerfile) builds both apps and runs the server as a non-root user. The server serves the web app and the API from one origin:

```bash
docker build -t tapcare .
docker run -p 8787:8787 -e ANTHROPIC_API_KEY=... -e ALLOWED_ORIGINS=https://your.domain tapcare
```

Serve it over HTTPS in production, because browsers require HTTPS for camera access.

## Privacy

- Camera frames are downscaled on the device (longest side 1280px, JPEG) and sent only to analyse that one step.
- The server does not store frames and never logs them. Logs contain request IDs, status codes and timings.
- Only the text of previous steps is sent with each request, never previous photos.
- Settings and the trusted contact stay in the browser's `localStorage`.

## Documentation

- [Architecture](docs/ARCHITECTURE.md): components, the agent loop, and design decisions
- [API reference](docs/API.md)
- [Code quality checklist](docs/CODE_QUALITY_CHECKLIST.md) (Bahasa Indonesia)
- [Product notes and roadmap](docs/PRODUCT_NOTES.md) (Bahasa Indonesia)
- [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)
