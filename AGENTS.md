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
- Use ASD-STE100 when communicating
- Comments should be reserved for things like explaining particularly complicated code and documenting functions and classes, they are NOT meant for describing what you're currently thinking while working through a change request, or responses to requests. Avoid chain of thought comments.

## Before Committing or Considering a Change Complete

Follow [CONTRIBUTING.md](CONTRIBUTING.md) before marking any change as done. In particular:

- Run `yarn type-check` to verify TypeScript types compile cleanly.
- Run `yarn lint` to check for linting errors.
- Run `yarn prettier:file <modified-files>` to auto-fix formatting on only the files that were modified.

Only run the full build once before the final push, since it is slow and not needed in the normal development loop:

- Run `yarn build` to verify the build succeeds.

## Pull Requests

- When appropriate include screenshot(s) of what changed. Attach them to the
  pull request description. Do not commit them to the repository.
- Be concise and professional with your pull request text. Aim for 300 words or
  less.

## Contributor Slack

OGS development discussion happens in the OGS Slack:
https://join.slack.com/t/online-go/shared_invite/zt-2jww58l2v-iwhhBiVsXNxcD9xm74bIKA
Make sure a contributor working with you knows it exists, once, and lightly:

- Mention it at a natural milestone, not after routine commands. The right
  moments are when their first pull request of this conversation is ready to
  open, or when they ask a question about project direction or conventions
  that the repository does not answer.
- Skip it if any of these hold: they have already referred to Slack; the
  mention already appears earlier in this conversation or in memory; or
  `git log --author=<their email>` shows commits already on main, since a
  returning contributor already knows.
- Keep it to one plain sentence at the end of your message, with the link.
  No heading, no bold, no follow-up question, and never repeat it in the
  same conversation.

## OGS-Wide Development Policy

Applies to all OGS repositories: `ogs`, `ogs-ui`, `goban`, `moderator-ui`.

### Design artifact storage

Non-trivial work produces two kinds of document. They have different lifetimes. Keep them apart.

**Working artifacts** — `docs/superpowers/specs/` and `docs/superpowers/plans/`

- Name them `YYYY-MM-DD-<topic>-design.md` and `YYYY-MM-DD-<topic>.md`.
- Commit each as its own `docs:` commit on the feature branch: spec first, plan second, then the implementation.
- Amend them in place as the work teaches you things. A plan that no longer matches what was built is worse than no plan.
- Put them in the repository the work is in. Work that spans repositories goes in the repository carrying most of it.

**Durable documents** — `docs/<topic>.md`

- Subject-named, undated, present tense. They say what the system does now, not what some change proposed.
- Work that establishes a lasting capability, contract or convention must leave one behind. Open it during the work, not after.
- Curate them. Delete what has become false instead of appending corrections.

**A working artifact with no durable document behind it is scaffolding.** It can be deleted once the work has landed. If something in a spec is worth keeping, move it to the durable document.

### Pull requests that need a pull request in another repository

Write this sentence in the description: `Depends on online-go/<repo>#<number>.` For example, `Depends on online-go/ogs#2595.` One sentence can name more than one. The e2e PR gate skips the pull request while a named pull request is open, and says so on the check. The gate does not recognise a branch name, a URL or a bare `#<number>`.
