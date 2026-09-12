# End-to-end tests

Playwright tests exercise user journeys against a running OGS frontend and
backend. See [the testing guide](../docs/e2e-testing.md) for coverage ownership
and the runtime target, and [AGENTS.md](AGENTS.md) for test-writing rules.

## Run tests

Install the project dependencies with `yarn`, then install the browser with
`yarn playwright install --with-deps chromium`. Start the local OGS services and
seed their test data with the backend's `init_e2e` command. Tests that need a full
moderator also need `E2E_MODERATOR_PASSWORD`.

| Command                | Selection                                                       |
| ---------------------- | --------------------------------------------------------------- |
| `yarn test:e2e`        | Build once, then run automated browser tests, including `@Slow` |
| `yarn test:e2e:built`  | Same tests against the existing production build                |
| `yarn test:e2e:dev`    | Tests against the development frontend; one worker by default   |
| `yarn test:e2e:quick`  | Excludes `@Slow` as well as manual, visual, and utility tests   |
| `yarn test:e2e:ui`     | Playwright UI                                                   |
| `yarn test:e2e:debug`  | Playwright debugger                                             |
| `yarn test:e2e:smoke`  | CI smoke tests in the standard Playwright Docker image          |
| `yarn test:e2e:docker` | Playwright in the standard Docker image                         |
| `yarn test:ci`         | Docker smoke tests and Jest tests                               |

Append Playwright arguments, for example:

```sh
yarn test:e2e --grep 'Acknowledge warnings'
yarn test:e2e:built --workers=4 --repeat-each=3
```

`FRONTEND_URL` defaults to `http://localhost:8080`. Full tests run in parallel
with six workers against built assets. Development commands default to one worker
because development modules use more browser memory. Set `E2E_WORKERS` or pass `--workers` to change this. Retries
are disabled so failures remain visible. `@Manual`, `@Visual`, and `@E2EUtils`
tests are excluded from automatic runs.

When `CI` is set, the configuration selects only smoke tests and defaults to one
worker. Smoke screenshots require the standard Docker image.

`test:e2e` and `test:e2e:quick` build automatically. For `test:e2e:built`, first run
`yarn build` after source changes. The development server must still
be available: the runner uses its resolved HTML template and backend proxy
configuration. The runner serves the built assets on port 8081 and closes that
server when Playwright exits. Set `E2E_PREVIEW_PORT` to use another port.
Development-server checks continue to use the development server. Build time
and service startup time are separate from browser-suite timing.

In the local Docker stack, dependencies and Chromium can be installed only in
`ogs_ui_1`. In that case, run the commands inside that container. Export
`E2E_MODERATOR_PASSWORD` in the host shell first, using the seeded moderator's
password:

```sh
docker exec -e E2E_MODERATOR_PASSWORD ogs_ui_1 yarn test:e2e
```

`docker exec` does not inherit host shell variables unless `-e` passes them in.
The built runner stops before building or starting browsers when the moderator
password is absent. `--list`, `--help`, and CI smoke runs do not need it or a
build. Use `test:e2e:dev` for focused development-server testing.

## Write tests

Use Jest for component behavior, form permutations, and client logic. Keep
browser tests for user journeys that need real server integration. Use backend
normal tests for server policy and time-dependent rules.

Each feature directory has a `.spec.ts` file that registers its scenarios. Use
the `ogsTest` fixture so browser contexts are closed and rendered error
boundaries fail the test. Create additional contexts through `createContext`.
Close a context early when its user has no further work.

`prepareNewUser` creates a unique account and its initial preferences through
the API. Drive the feature under test through the UI. Registration and login
forms have separate smoke coverage. Use `newTestUsername` with a short role
name; the helper checks the role length against the server's username limit.

Seeded accounts supply privileges that ordinary users cannot grant. Do not
share mutable scenario data. Report tests must navigate by their full report
ID and count their reporter's own reports. A moderator's global queue can
change while another worker runs.

Wait for observable state or request completion. Avoid fixed sleeps, shared
state files, and process-wide browser cleanup. Do not use retries to hide a
failure. Inspect the failure trace and reproduce the cause.

## Failure artifacts and screenshots

Playwright retains failure screenshots, traces, and videos when available.
CI uploads these under the test job's **Upload e2e results** step.

To update smoke screenshots, run the smoke tests with
`--update-snapshots`, review each changed image, and rerun the smoke tests.
Commit only the intended reference changes.
