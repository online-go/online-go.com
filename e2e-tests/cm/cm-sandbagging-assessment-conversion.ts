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

// cspell:words SBAS

/*
 * Uses init_e2e data:
 * - E2E_CM_SBES_V1 : CM with sandbagging power (to verify they cannot see the report)
 *
 * Creates dynamically:
 * - accused user (who wins the game) - created fresh each run
 * - other user (opponent who loses) - created fresh each run
 * - game between them that ends by opponent resignation
 *
 * Note: When the reporter submits a "sandbagging" report and the accused player
 * WON the game, the backend automatically converts it to a "sandbagging_assessment"
 * report. This type of report is moderator-only - CMs cannot see or handle it.
 * This test verifies that conversion and access control work correctly.
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
    setupSeededModerator,
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

export const cmSandbaggingAssessmentConversionTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    // Create the accused (who will WIN the game - opponent resigns)
    const accusedUsername = newTestUsername("SBASAcc"); // cspell:disable-line
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    // Create the other player (opponent who will lose)
    const otherUsername = newTestUsername("SBASOth"); // cspell:disable-line
    const { userPage: otherPage } = await prepareNewUser(createContext, otherUsername, "test");

    // Accused challenges the other player
    await createDirectChallenge(accusedPage, otherUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E SBAS Game",
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

    // Play at least 6 moves (required before resignation is allowed)
    const moves = ["D5", "E5", "D6", "E6", "D7", "E7", "D8", "E8"];
    await playMoves(accusedPage, otherPage, moves, "9x9", 0);

    // The OPPONENT resigns - this means the ACCUSED WON the game.
    // When reporter submits a "sandbagging" report, the backend will convert
    // it to "sandbagging_assessment" because the accused won (not thrown_game).
    await resignActiveGame(otherPage);

    // Capture the game URL for the reporter to navigate to
    const gameUrl = accusedPage.url();

    // Create the reporter
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        newTestUsername("SBASRep"), // cspell:disable-line
        "test",
    );

    await withReportCountTracking(reporterPage, testInfo, async (tracker) => {
        // Reporter navigates to the game
        await reporterPage.goto(gameUrl);

        // Wait for the game page to fully load
        const reporterGoban = reporterPage.locator(".Goban[data-pointers-bound]");
        await reporterGoban.waitFor({ state: "visible" });

        // Wait for the Player link to be fully ready before attempting to report
        const playerLink = reporterPage.locator(
            `a.Player[data-ready="true"]:has-text("${accusedUsername}")`,
        );
        await expect(playerLink.first()).toBeVisible({ timeout: 15000 });

        // Reporter submits a "sandbagging" report - but since the accused WON,
        // the backend will convert this to a "sandbagging_assessment" report
        await reportUser(
            reporterPage,
            accusedUsername,
            "sandbagging",
            "E2E test reporting sandbagging: suspicious win pattern.", // min chars
        );

        // Verify reporter's count increased by 1
        await tracker.assertCountIncreasedBy(reporterPage, 1);

        // Capture the report number from the reporter's "My Own Reports" page
        const reportNumber = await captureReportNumber(reporterPage);

        // Set up a CM with sandbagging power to verify they CANNOT see the report
        const { seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
            createContext,
            "E2E_CM_SBES_V1",
        );

        // CM navigates to the report - they should NOT be able to see it
        // because sandbagging_assessment is moderator-only
        await navigateToReport(cmPage, reportNumber);

        // The CM should see a message indicating they don't have access or the report isn't available
        // Check that the report content is NOT visible to the CM
        await expect(
            cmPage.getByText("E2E test reporting sandbagging: suspicious win pattern."),
        ).not.toBeVisible({ timeout: 5000 });

        // Verify the CM sees some indication they can't access this report
        // (the exact message depends on the UI, but they shouldn't see the report details)
        const reportTypeSelector = cmPage.locator(".report-type-selector");
        const selectorVisible = await reportTypeSelector.isVisible().catch(() => false);
        if (selectorVisible) {
            // If selector is visible, it should NOT show Sandbagging Assessment to CMs
            // (they shouldn't even get this far, but double-check)
            await expect(reportTypeSelector).not.toContainText("Sandbagging Assessment");
        }

        // Clean up CM context
        await cmContext.close();

        // Now verify that a full moderator CAN see and handle the report
        const { seededModeratorPage: modPage, seededModeratorContext: modContext } =
            await setupSeededModerator(createContext);

        // Navigate to the report
        await navigateToReport(modPage, reportNumber);

        // Verify the report type is shown as "Sandbagging Assessment"
        const modReportTypeSelector = modPage.locator(".report-type-selector");
        await expect(modReportTypeSelector).toContainText("Sandbagging Assessment");

        // Verify the moderator can see the report content
        await expect(
            modPage.getByText("E2E test reporting sandbagging: suspicious win pattern.").first(),
        ).toBeVisible({ timeout: 15000 });

        // Moderator claims and closes the report
        const claimButton = await expectOGSClickableByName(modPage, /Claim/i);
        await claimButton.click();
        await modPage.waitForTimeout(1000);

        // Close the report
        const closeButton = await expectOGSClickableByName(modPage, /Close as good report/i);
        await closeButton.click();

        // Wait for the report to be processed
        await modPage.waitForTimeout(2000);

        // Verify the reporter's count has returned to initial (report is now closed)
        await tracker.assertCountReturnedToInitial(reporterPage);

        // Clean up moderator context
        await modContext.close();
    });
};
