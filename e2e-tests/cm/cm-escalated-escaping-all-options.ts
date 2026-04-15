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

// cspell:words EAEE

/*
 * Tests that after escalating an escaping report, ALL voting options are
 * available — including both formal and informal warnings — regardless of
 * the accused's escape rate.
 *
 * This is a regression test for a bug where the frontend's escape-rate-based
 * filtering (which hides formal or informal options depending on rate) was
 * incorrectly applied to escalated reports, masking options that should be
 * available.
 *
 * Uses init_e2e data:
 * - E2E_CM_EAEE_V1 : CM who places initial vote then escalates
 * - E2E_CM_EAEE_V2 : CM who checks options after escalation
 *
 * Creates dynamically:
 * - accused user (reported for escaping) - created fresh each run
 * - other user (opponent) - created fresh each run
 * - game between them that ends by resignation
 *
 * Flow:
 * 1. Accused and other play a short game; other resigns
 * 2. Fresh reporter reports accused for escaping on that game
 * 3. CM V1 votes on the report (any option), then CM V1 escalates
 * 4. CM V2 navigates to the escalated report and verifies ALL escaping
 *    options are present (formal, informal, final warning, suspend, etc.)
 * 5. Reporter cancels the report to clean up
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, TestInfo } from "@playwright/test";

import {
    captureReportNumber,
    navigateToReport,
    newTestUsername,
    prepareNewUser,
    reportUser,
    setupSeededCM,
} from "@helpers/user-utils";

import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";

import { playMoves, resignActiveGame } from "@helpers/game-utils";

import { expectOGSClickableByName } from "@helpers/matchers";
import { expect } from "@playwright/test";
import { withReportCountTracking } from "@helpers/report-utils";

export const cmEscalatedEscapingAllOptionsTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    // Create the accused (will be reported for escaping)
    const accusedUsername = newTestUsername("EAEEAcc"); // cspell:disable-line
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    // Create the other player (opponent)
    const otherUsername = newTestUsername("EAEEOth"); // cspell:disable-line
    const { userPage: otherPage } = await prepareNewUser(createContext, otherUsername, "test");

    // Accused challenges the other player to a short game
    await createDirectChallenge(accusedPage, otherUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E EAEE Game",
        boardSize: "9x9",
        speed: "blitz",
        timeControl: "byoyomi",
        mainTime: "2",
        timePerPeriod: "2",
        periods: "1",
    });

    // Other player accepts
    await acceptDirectChallenge(otherPage);

    // Wait for the game to start
    const goban = accusedPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    // Play a few moves so the escaping report applicability check passes (needs >= 2 moves)
    const moves = ["D5", "E5", "D6", "E6", "D7", "E7", "D8", "E8"];
    await playMoves(accusedPage, otherPage, moves, "9x9");

    // Other resigns — accused wins. This means the escaping applicability check
    // won't reject the report (it only rejects if the reported user resigned).
    await resignActiveGame(otherPage);

    // Capture the game URL for the reporter to navigate to
    const gameUrl = accusedPage.url();

    // Create the reporter
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        newTestUsername("EAEERep"), // cspell:disable-line
        "test",
    );

    await withReportCountTracking(reporterPage, testInfo, async (tracker) => {
        // ========================================
        // Phase 0: Report the accused for escaping on the played game
        // ========================================

        await reporterPage.goto(gameUrl);

        // Wait for the game page to fully load
        const reporterGoban = reporterPage.locator(".Goban[data-pointers-bound]");
        await reporterGoban.waitFor({ state: "visible" });

        await reportUser(
            reporterPage,
            accusedUsername,
            "escaping",
            "E2E test - EAEE reporting escaping!",
        );

        await tracker.assertCountIncreasedBy(reporterPage, 1);

        const reportNumber = await captureReportNumber(reporterPage);

        // ========================================
        // Phase 1: CM V1 places an initial vote (any option)
        // ========================================

        const { seededCMPage: v1Page, seededCMContext: v1Context } = await setupSeededCM(
            createContext,
            "E2E_CM_EAEE_V1",
        );

        await navigateToReport(v1Page, reportNumber);

        await expect(v1Page.getByText("E2E test - EAEE reporting escaping!")).toBeVisible();

        // Vote for the first available option (doesn't matter which)
        await v1Page.locator('.action-selector input[type="radio"]').first().click();
        let voteButton = await expectOGSClickableByName(v1Page, /Vote$/);
        await voteButton.click();

        await v1Context.close();

        // ========================================
        // Phase 2: CM V1 (new session) escalates the report
        // ========================================

        const { seededCMPage: escalatorPage, seededCMContext: escalatorContext } =
            await setupSeededCM(createContext, "E2E_CM_EAEE_V1");

        await navigateToReport(escalatorPage, reportNumber);

        await expect(escalatorPage.getByText("E2E test - EAEE reporting escaping!")).toBeVisible();

        // Escalation is always the last radio option
        await escalatorPage.locator('.action-selector input[type="radio"]').last().click();
        await escalatorPage.locator("#escalation-note").fill("E2E test - EAEE escalation note");

        voteButton = await expectOGSClickableByName(escalatorPage, /Vote$/);
        await voteButton.click();

        await escalatorContext.close();

        // ========================================
        // Phase 3: CM V2 views the escalated report and verifies all options
        // ========================================

        const { seededCMPage: v2Page, seededCMContext: v2Context } = await setupSeededCM(
            createContext,
            "E2E_CM_EAEE_V2",
        );

        await navigateToReport(v2Page, reportNumber);

        // Confirm escalation happened
        await expect(
            v2Page.getByText("Escalated due to VotingOutcome.VOTED_ESCALATION"),
        ).toBeVisible();

        // These are all the escaping actions that should be present after escalation
        // on a finished game (no "call" actions since the game is over, no "escalate").
        // Critically, both formal AND informal options must be present — the bug was
        // that escape-rate filtering hid some of these on escalated reports.
        const expectedActions = [
            "annul_escaped",
            "warn_escaper",
            "informal_warn_escaper",
            "informal_warn_escaper_and_annul",
            "no_escaping",
            // not_escaping_cancel may or may not be present depending on reporter/loser status
            "final_warning_escaping",
            "final_warning_escaping_and_annul",
            "suspend_user",
            "suspend_user_and_annul",
            "annul_no_warning",
        ];

        for (const action of expectedActions) {
            const radio = v2Page.locator(`input[value="${action}"]`);
            await expect(radio).toBeVisible({
                timeout: 15000,
            });
        }

        // Verify "escalate" is NOT present (already escalated)
        const escalateRadio = v2Page.locator('input[value="escalate"]');
        await expect(escalateRadio).not.toBeVisible();

        await v2Context.close();

        // ========================================
        // Phase 4: Reporter cancels the report to clean up
        // ========================================

        await reporterPage.goto("/reports-center");
        const myReports = reporterPage.getByText("My Own Reports");
        await expect(myReports).toBeVisible();
        await myReports.click();

        const cancelButton = await expectOGSClickableByName(reporterPage, /Cancel$/);
        await cancelButton.click();

        await tracker.assertCountReturnedToInitial(reporterPage);
    });
};
