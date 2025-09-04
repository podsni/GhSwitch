# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` (CLI entry flow in `src/cli.ts`, operations in `src/flows.ts`, Git/SSH helpers in `src/git.ts` and `src/ssh.ts`, shared utilities in `src/utils/`).
- Entry points: `index.ts` (invokes `main()` from `src/cli.ts`).
- Build artifacts: `build/` (native binaries produced by Bun compile).
- Scripts: release/build/install helpers in `build.sh`, `release.sh`, `install.sh`, `publish-npm.sh`, `test-installation.sh`.
- Config: `package.json`, `tsconfig.json`.

## Build, Test, and Development Commands
- Run locally: `bun run index.ts` or `bun start` — launches the interactive CLI.
- Build (default): `bun run build` — compiles to a native binary at `build/ghswitch`.
- Platform builds: `bun run build:linux|build:windows|build:macos|build:macos-arm|build:linux-arm` — target-specific binaries.
- Clean: `bun run clean` — removes `build/*` and `checksums.txt`.
- Release: `./release.sh [--draft]` — prepares tagged release artifacts.

## Coding Style & Naming Conventions
- Language: TypeScript (ES modules), strict mode per `tsconfig.json`.
- Indentation: 2 spaces; prefer single quotes or consistent import style as in existing files.
- Filenames: lowercase, short, descriptive (e.g., `cli.ts`, `flows.ts`, `utils/ui.ts`).
- Naming: `camelCase` for variables/functions, `PascalCase` for types/interfaces, `UPPER_SNAKE` for constants.
- Exports: prefer named exports; keep modules focused and small.
- Shell execution: use `src/utils/shell.ts` wrapper instead of ad‑hoc child processes.

## Testing Guidelines
- Current repo has no test suite; if adding tests, use Bun’s test runner.
- File pattern: place tests near sources as `*.test.ts` (e.g., `src/git.test.ts`).
- Run tests: `bun test`.
- Aim for coverage on Git/SSH flows, non‑interactive helpers, and error paths.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits where possible (`feat:`, `fix:`, `docs:`, `chore:`). Example: `feat: add cross-platform SSH path handling`.
- PRs: include a concise summary, linked issues (`Closes #123`), platform notes (OS, Bun/Node versions), and screenshots or terminal output for CLI interactions.
- Keep PRs small and focused; update `README.md` when behavior or usage changes.

## Security & Configuration Tips
- Never commit secrets. The tool touches `~/.ssh` and Git configs—test on non‑critical repositories first.
- Back up SSH keys before switching; prefer host aliases to avoid breaking existing remotes.
