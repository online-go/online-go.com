# Project: online-go.com

React/TypeScript frontend for online-go.com. Uses Vite, PostCSS, yarn. `main`
is the primary trunk git branch.

## Layout

- `src/components/` - Shared React components
- `src/views/` - Page views
- `src/lib/` - Core utilities (`data.ts`, `sockets.ts`, `preferences.ts`, `GobanController.ts`)
- `src/models/` - TypeScript types
- `submodules/goban/` - Go board engine (submodule)

## Path Aliases

- `@/*` -> `src/*`
- `goban` -> `submodules/goban/src`
- `react-dynamic-help` -> `submodules/react-dynamic-help/src`

## Rules

- No `any` types. No emojis. Use `yarn` for package management, not `npm`.
- **One component per file** (required for Vite HMR). Each component gets its own `.tsx` and matching `.css` file. Never define multiple components in one file.
- Co-locate components used by a single parent in the parent's directory (e.g., `GobanLayout/PlayerInfo.tsx`). Shared components go in `src/components/`.
- CSS uses PostCSS nested syntax. Shared `$variables` go in `src/global_styl/00_constants.css` and must be explicitly imported. Runtime `var(--name)` variables are in `src/global_styl/01_variables.css`.
- No pulsing/throbbing animations. No `translateY`/`translateX` on hover. No hover background changes on non-interactive elements.
- All user-visible strings must be translated. Use `pgettext(context, msgid)` (or `llm_pgettext` for LLM-translated strings), `ngettext`/`npgettext` for plurals, and `interpolate()` for parameterized strings. Import from `@/lib/translate`. See `src/lib/translate.ts` for details.
- Code must build and pass linting/formatting.

## Before Committing or Considering a Change Complete

Follow [CONTRIBUTING.md](CONTRIBUTING.md) before marking any change as done. In particular:

- Run `yarn type-check` to verify TypeScript types compile cleanly.
- Run `yarn lint` to check for linting errors.
- Run `yarn prettier:file <modified-files>` to auto-fix formatting on only the files that were modified.

Only run the full build once before the final push, since it is slow and not needed in the normal development loop:

- Run `yarn build` to verify the build succeeds.

Before submitting a PR, remind the author to perform manual testing in both mobile and desktop browsers.

## Pull Requests

- Follow the repository PR template at `.github/pull_request_template.md` when creating pull requests.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
