# Project: online-go.com

React/TypeScript frontend for online-go.com. Uses Vite, PostCSS, `yarn`.

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

- No `any` types. No emojis. Use `yarn`, not `npm`.
- **One component per file** (required for Vite HMR). Each component gets its own `.tsx` and matching `.css` file. Never define multiple components in one file.
- Co-locate components used by a single parent in the parent's directory (e.g., `GobanLayout/PlayerInfo.tsx`). Shared components go in `src/components/`.
- CSS uses PostCSS nested syntax. Shared `$variables` go in `src/global_styl/00_constants.css` and must be explicitly imported. Runtime `var(--name)` variables are in `src/global_styl/01_variables.css`.
- No pulsing/throbbing animations. No `translateY`/`translateX` on hover. No hover background changes on non-interactive elements.
- All user-visible strings must be translated. Use `pgettext(context, msgid)` (or `llm_pgettext` for LLM-translated strings), `ngettext`/`npgettext` for plurals, and `interpolate()` for parameterized strings. Import from `@/lib/translate`. See `src/lib/translate.ts` for details.
- Code must build and pass linting/formatting.

## Before Committing or Considering a Change Complete

Follow [CONTRIBUTING.md](CONTRIBUTING.md) before marking any change as done. In particular:

- Run `yarn build` to verify the build succeeds.
- Run `yarn lint` to check for linting errors.
- Run `yarn prettier` to check formatting (use `yarn prettier --write` to auto-fix; only target the files that were modified).
