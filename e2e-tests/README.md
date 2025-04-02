# Table of Contents

-   [Overview](#overview)
    -   [Default tests to run](#default-tests-to-run)
-   [yarn targets](#yarn-targets)
    -   [`test:e2e`](#teste2e)
    -   [`test:e2e:quick`](#teste2equick)
    -   [`test:e2e:smoke`](#teste2esmoke)
    -   [`test:e2e:ui`](#teste2eui)
    -   [`test:e2e:debug`](#teste2edebug)
    -   [`test:ci`](#testci)
    -   [`test:e2e:docker`](#teste2edocker)
    -   [`test:e2e:docker:smoke`](#teste2edockersmoke)
-   [Smoke Tests](#smoke-tests)

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

# Smoke Tests

The "Smoke Tests" have to be run in a docker, because they contain screenshot-based tests, which need an identical OS & Browser in order to pass.

## Updating the screenshots

If you need to update the screenshots, the easiest thing to do is

-   Delete the reference screenshots from the folder in e2e-tests/smoke/smoketests.spec.ts-snapshots

-   Run `yarn test:e2e:smoke`

It will say it failed - and it will have generate new screenshots.

If you run it again, it should pass.
