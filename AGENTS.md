# Repository Guidelines

## Project Structure & Module Organization
This repository is currently planning-first. The main product spec lives in `specs/000-overview.md`, and `メモ.md` contains exploratory notes and unresolved ideas. Keep formal requirements in `specs/` and use zero-padded filenames such as `001-<topic>.md` for new specs.

When implementation starts, keep the code organized by integration boundary so the Slack-to-Drive flow is easy to follow. A practical layout would be `src/slack/`, `src/drive/`, `src/config/`, and `tests/`. Do not mix draft notes with executable code.

## Build, Test, and Development Commands
The project uses Google Apps Script with clasp. Use these root-level commands:

- `npm install` to install clasp
- `npm run check` to syntax-check the Apps Script source files with Node.js
- `npm run clasp:login` to authenticate clasp
- `npm run clasp:create` to create the initial Apps Script project
- `npm run clasp:push` to push `src/` to Apps Script
- `npm run clasp:deploy` to create a web app deployment
- `npm run clasp:open` to open the Apps Script project
- `rg --files` to list repository files quickly
- `git status` to confirm only intended files changed

Do not commit local clasp credentials or generated `node_modules/`.

## Coding Style & Naming Conventions
Write concise, task-focused Markdown. Prefer short sections, bullet lists, and concrete examples over long prose. Use kebab-case for new English filenames and preserve numeric prefixes in `specs/`.

For future source code, keep naming descriptive and integration-based: `slack-event-handler`, `drive-uploader`, `folder-path-resolver`. Avoid hard-coded IDs, secrets, and dates outside configuration.

## Testing Guidelines
The initial spec explicitly skips automated tests. For now, use `npm run check` plus manual Slack-to-Drive verification documented in `README.md` and `specs/000-overview.plan.md`.

If tests are added later, cover the business rules first, especially folder path generation and the October 1 generation rollover (`45th` to `46th`). Mock Slack and Google Drive APIs instead of depending on live services. Name tests after behavior, for example `folder-path-resolver.test.*` or `test_folder_path_rollover_*`.

## Commit & Pull Request Guidelines
The repository has no commit history yet, so establish a simple standard now: use short imperative commit subjects such as `Add Drive folder naming rules`. Keep each commit focused on one concern.

Pull requests should include a summary, linked spec or issue, manual verification steps, and screenshots or log excerpts when Slack behavior changes.

## Security & Configuration Tips
Never commit Slack bot tokens, signing secrets, Google service account keys, or Drive folder IDs. Store them in environment variables or a local secret manager, and document required permissions alongside the implementation.
