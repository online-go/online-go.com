# Table of Contents

-   [Overview](#overview)

    -   [Default tests to run](#default-tests-to-run)

-   [Smoke Tests](#smoke-tests)

    -   [Updating the screenshots](#updating-the-screenshots)
    -   [Debugging failed CI e2e tests](#debugging-failed-ci-e2e-tests)

-   [yarn targets](#yarn-targets)

    -   `test:e2e`
    -   `test:e2e:quick`
    -   `test:e2e:smoke`
    -   `test:e2e:ui`
    -   `test:e2e:debug`
    -   `test:ci`
    -   `test:e2e:docker`
    -   `test:e2e:docker:smoke`

-   [Writing Tests](#writing-tests)

    -   [Multi-user tests](#multi-user-tests)
    -   [Seeded Data](#seeded-data)

# Overview

In here we have Playwright-based End to End testing (PW: Playwright)

There are two main "kinds" of tests:

-   "Smoke tests", which we run in the CI on every PR

    -   These are intended to be quick to run, and just make sure things are not totally broken

-   "Full Tests", which are not run automatically, they can be run as needed
    -   These are intended to grow to cover as much as possible

Some individual "Full Tests" are particularly slow: these are marked by the @Slow PW tag.

Slow tests are skipped by the yarn "test:e2e:quick" target.

-   Note that it's still not especially quick, what do you expect? 😝

## Default tests to run

Our PW config is set up so that if the environment variable `CI` is set, then Smoke Tests run,
otherwise "all the non smoke tests" are run.

# Smoke Tests

The "Smoke Tests" have to be run in a docker, because they contain screenshot-based tests, which need an identical OS & Browser in order to pass.

## Updating the screenshots

If you need to update the screenshots, the easiest thing to do is

-   Delete the reference screenshots from the folder in e2e-tests/smoke/smoketests.spec.ts-snapshots

-   Run `yarn test:e2e:smoke`

It will say it failed - and it will have generated new screenshots for you.

If you run it again, it should pass. You can commit the screenshots and that's it.

## Debugging failed CI e2e tests

Playwright writes useful stuff when tests fail - screenshots and an activity log.

If the e2e test fails in the CI, it stores this stuff - a link is provided in the CI build log

# yarn targets

There are various yarn targets that support e2e. See package.json 😝

Worthy of mention are:

    "test:e2e"

Just fires up Playwright to do whatever it does by default. Most useful if you want to add arguments about which individual test to run.

The default will be as described above - based on `CI` environment variable.

    "test:e2e:quick"

Filters out Smoke and Slow tests.

    "test:e2e:smoke"

Runs the Smoke Tests _using a playwright docker to get standard OS and browsers_.

    "test:e2e:ui"

Fires up the PW UI (which will present all the tests as options to run manually)

    "test:e2e:debug"

Fires up the PW UI in debug mode.

    "test:ci"

This is the command run by the CI.

It runs the PW Smoke Test (with PW in a docker) _and_ the jest unit tests.

    "test:e2e:docker": "scripts/run-playwright-in-docker.sh",

This fires up PW to run in the standard docker.

It does NOT set `CI` to be true, so it is a way that you can run non-Smoke tests in the PW docker, if you want to do that for some reason.

    "test:e2e:docker:smoke"

This runs the Smoke Tests from the PW docker.

# Writing Tests

Things of note:

-   Playwright has a "search path" that picks up \*\*_/\*_.spec.ts
-   The \*\* are used by us to group tests into "functional things under test"
-   Each "functional set" has single spec.ts file in the folder called

    `func`/`function.spec.ts`

-   This includes the individual tests, each of which is in its own file: NOT a .spec.ts file.
-   Each .spec.ts file provides Playwright `@tag` for the set of tests, which is useful for selecting those tests only on the command line.
-   Individual tests that have to wait a long time have a `@Slow` tag
-   Which should not be taken to mean that the other tests are quick 😝

-   Playwright tests use a "test fixture" typically called `test`.
    -   We have a subclassed version of this `ogsTest`
        -   it adds checking at the end of each test that no `ErrorBoundary` appeared

## Multi-user tests

-   user-utils.ts provides helper functions for doing multi-user tests.
    -   `prepareNewUser` creates a new browser context with the named new user logged in.
    -   Tests must create their users from fresh each time (except see below)
    -   `newTestUsername` provides a means of creating a unique new username.
    -   It takes as an argument a user-identifier, which is intended to help understand what test
        and what role this user plays in it.
    -   \*\* _This can be at most 12 characters_
        unfortunately a run-time failure because typing can't specify this
        -   The reason is because it uses time to generate the uniquifier, and we only have a total
            of 20 characters to play with in an OGS username! 8 characters gives us unique names at about 1 minute intervals.

## Seeded Data

-   The backend has a function (called init_e2e) that seeds (and re-seeds, to fix broken seeded data) data
-   Tests that use seeded data say so, in comments at the top.
-   Seeded data should not be shared between tests (it creates maintenance nightmares)
-   There is a naming convention for seeded data entities - hopefully obvious.

Why do we need seeded data?

-   We can't test "moderator level" features because we can't create moderators via an API
    -   This means that any "test data" that a moderator would put in place has to be seeded in the target DB.
    -   Notably: this is "Community Moderators" - users with CM powers have to be seeded.
