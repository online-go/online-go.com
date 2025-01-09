---
name: repo
type: repo
agent: CodeActAgent
---

This repository contains the front end source code for Online-Go.com, a website
that allows players to play the game of Go with other users from around the
world.

## General Setup:

When initializing you'll need to install `yarn` and run `yarn install`.

To build the application you'll run `yarn run build`.

To check for and fix most lint errors run `npm run lint:fix`

To check for and fix formatting errors run `npm run prettier`

When making changes:

-   You must not remove features.
-   You must fill in all generated TODO blocks with the appropriate code.

When asked to refactor or port code you must ensure that there are no functional difference between the old and new version.

Before pushing any changes, you should ensure that all of the following are true:

-   The code builds
-   The code has been linted and all lint errors fixed
-   The code has been formatted and all formatting errors fixed

If any of these fail, you should fix the issues before pushing your changes.

When creating pull requests, create them against the https://github.com/online-go/online-go.com/ repository.
