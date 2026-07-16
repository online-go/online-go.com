/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// cspell:words ERGA

/*
 * Proves the escape-rate window is anchored to the reported game's completion
 * time, not the report's filing time. A game the player escaped AFTER the
 * reported game must not count toward the reported game's rate — even when its
 * own report is resolved first.
 *
 * Scenario:
 *  - Play game G, report it, leave it pending (the game under inspection).
 *  - Play game H (ends after G), report it, 3 CMs vote informal_warn_escaper
 *    so H carries an escape warning.
 *  - View report G as a CM.
 *
 * Game-anchored (correct): G's window is games ended <= G.ended = {G}. H is
 *   excluded. Predictive display: "1 escapes in 1 games".
 * Report-anchored (old bug): G's window is {G, H}; H's warning counts, giving
 *   "2 escapes in 2 games".
 *
 * Uses init_e2e seeded CMs E2E_CM_ERGA_V1/V2/V3 (escaping power).
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, Page, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

import {
    captureReportNumber,
    navigateToReport,
    newTestUsername,
    prepareNewUser,
    reportPlayerByColor,
    setupSeededCM,
} from "@helpers/user-utils";

import { waitForGameViewReady } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";
import { dismissWarningDialogs, withReportCountTracking } from "@helpers/report-utils";

import { playAndFinishGame, reportAndVote } from "./escape-rate-helpers";

const CM_VOTERS = ["E2E_CM_ERGA_V1", "E2E_CM_ERGA_V2", "E2E_CM_ERGA_V3"];

export const cmEscapeRateGameAnchorTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    // @Slow: plays two sequential games with a 30 s post-game quiesce each
    // (so Game.ended commits before the next escaping report — otherwise
    // moderate.py rejects it HTTP 400) plus one CM-voted resolution. The time
    // is cumulative setup, not flakiness; see e2e-tests/CLAUDE.md.
    const TIMEOUT_MS = 360 * 1000;

    const accusedUsername = newTestUsername("ERGAAcc"); // cspell:disable-line
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    const reporterUsername = newTestUsername("ERGARep"); // cspell:disable-line
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        reporterUsername,
        "test",
    );

    await withReportCountTracking(
        reporterPage,
        testInfo,
        async (tracker) => {
            const cmPages: Page[] = [];
            const cmContexts: BrowserContext[] = [];
            for (const cmUser of CM_VOTERS) {
                const { seededCMPage, seededCMContext } = await setupSeededCM(
                    createContext,
                    cmUser,
                );
                cmPages.push(seededCMPage);
                cmContexts.push(seededCMContext);
            }

            // Game G — ends first; reported and left pending. This is the game
            // whose escape-rate display we inspect.
            await playAndFinishGame(reporterPage, accusedPage, accusedUsername, 1);
            await waitForGameViewReady(reporterPage);
            await reportPlayerByColor(
                reporterPage,
                ".white",
                "escaping",
                "E2E ERGA: game G (left pending)",
            );
            await tracker.assertCountIncreasedBy(reporterPage, 1);
            const reportG = await captureReportNumber(reporterPage);

            await accusedPage.goto("/");
            await dismissWarningDialogs(accusedPage);
            await dismissWarningDialogs(reporterPage);

            // Game H — ends AFTER G; reported and resolved as escaping so it
            // carries an escape warning at inspection time.
            await playAndFinishGame(reporterPage, accusedPage, accusedUsername, 2);
            await reportAndVote(reporterPage, cmPages, "informal_warn_escaper");

            await accusedPage.goto("/");
            await dismissWarningDialogs(accusedPage);
            await dismissWarningDialogs(reporterPage);

            // Inspect report G.
            const cmPage = cmPages[0];
            await navigateToReport(cmPage, reportG);

            const escapeRateInfo = cmPage.locator(".escape-rate-info");
            await expect(escapeRateInfo).toBeVisible({ timeout: 15000 });

            // Game-anchored: H (ended after G) is excluded, so G's window is
            // {G} alone. Old report-anchored behaviour would show
            // "2 escapes in 2 games".
            const detail = cmPage.locator(".escape-rate-detail");
            await expect(detail).toBeVisible();
            await expect(detail).toContainText(/1 escapes? in 1 games?/);
            await expect(detail).not.toContainText("2 escapes");

            for (const ctx of cmContexts) {
                await ctx.close();
            }

            // Clean up: cancel the pending report on G.
            await reporterPage.goto("/reports-center/my_reports");
            const cancelButton = await expectOGSClickableByName(reporterPage, /Cancel$/);
            await cancelButton.click();
            await tracker.assertCountReturnedToInitial(reporterPage);
        },
        TIMEOUT_MS,
    );
};
