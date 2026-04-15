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

// cspell:words SBIP

/*
 * Tests that a sandbagging report filed during an in-progress game is
 * classified as "sandbagging_assessment" (not "thrown_game").
 *
 * This is a regression test: because Game.black_lost and Game.white_lost
 * both default to True, the old logic (checking if the accused "lost")
 * would incorrectly classify in-progress game reports as "thrown_game".
 * The fix checks whether the OTHER player won instead.
 *
 * Uses init_e2e data:
 * - E2E_CM_SBES_V1 : CM with sandbagging power (to verify they cannot see the report)
 *
 * Creates dynamically:
 * - accused user - created fresh each run
 * - other user (opponent) - created fresh each run
 * - game between them that stays in progress during the report
 *
 * Flow:
 * 1. Accused and other play a 9x9 game (some moves, no resignation)
 * 2. Reporter files a sandbagging report while the game is still in progress
 * 3. Verify the report is classified as "sandbagging_assessment" (not "thrown_game")
 * 4. Moderator closes the report to clean up
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

import { playMoves } from "@helpers/game-utils";

import { expectOGSClickableByName } from "@helpers/matchers";
import { expect } from "@playwright/test";

import { withReportCountTracking } from "@helpers/report-utils";

export const cmSandbaggingInProgressGameTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    // Create the accused
    const accusedUsername = newTestUsername("SBIPAcc"); // cspell:disable-line
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    // Create the other player (opponent)
    const otherUsername = newTestUsername("SBIPOth"); // cspell:disable-line
    const { userPage: otherPage } = await prepareNewUser(createContext, otherUsername, "test");

    // Accused challenges the other player with generous time so the game
    // stays in progress throughout the test
    await createDirectChallenge(accusedPage, otherUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E SBIP Game",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "120",
        timePerPeriod: "30",
        periods: "5",
    });

    // Other player accepts
    await acceptDirectChallenge(otherPage);

    // Wait for the game to start
    const goban = accusedPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    // Play some moves but do NOT end the game
    const moves = ["D5", "E5", "D6", "E6", "D7", "E7", "D8", "E8"];
    await playMoves(accusedPage, otherPage, moves, "9x9");

    // Capture the game URL while it's still in progress
    const gameUrl = accusedPage.url();

    // Create the reporter
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        newTestUsername("SBIPRep"), // cspell:disable-line
        "test",
    );

    await withReportCountTracking(reporterPage, testInfo, async (tracker) => {
        // Reporter navigates to the in-progress game
        await reporterPage.goto(gameUrl);

        // Wait for the game page to fully load
        const reporterGoban = reporterPage.locator(".Goban[data-pointers-bound]");
        await reporterGoban.waitFor({ state: "visible" });

        // Wait for the Player link to be fully ready
        const playerLink = reporterPage.locator(
            `a.Player[data-ready="true"]:has-text("${accusedUsername}")`,
        );
        await expect(playerLink.first()).toBeVisible({ timeout: 15000 });

        // Reporter submits a "sandbagging" report on the in-progress game.
        // Because the game is not over (no winner yet), this should become
        // "sandbagging_assessment", NOT "thrown_game".
        await reportUser(
            reporterPage,
            accusedUsername,
            "sandbagging",
            "E2E test: sandbagging report on in-progress game",
        );

        await tracker.assertCountIncreasedBy(reporterPage, 1);

        const reportNumber = await captureReportNumber(reporterPage);

        // Verify that a CM with sandbagging power CANNOT see this report
        // (sandbagging_assessment is moderator-only)
        const { seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
            createContext,
            "E2E_CM_SBES_V1",
        );

        await navigateToReport(cmPage, reportNumber);

        await expect(
            cmPage.getByText("E2E test: sandbagging report on in-progress game"),
        ).not.toBeVisible({ timeout: 5000 });

        await cmContext.close();

        // Verify that a full moderator CAN see it and it's "Sandbagging Assessment"
        const { seededModeratorPage: modPage, seededModeratorContext: modContext } =
            await setupSeededModerator(createContext);

        await navigateToReport(modPage, reportNumber);

        // This is the key assertion: the report must be "Sandbagging Assessment",
        // not "Thrown Game". Before the fix, both black_lost and white_lost
        // defaulting to True caused in-progress games to be misclassified.
        const modReportTypeSelector = modPage.locator(".report-type-selector");
        await expect(modReportTypeSelector).toContainText("Sandbagging Assessment");

        await expect(
            modPage.getByText("E2E test: sandbagging report on in-progress game").first(),
        ).toBeVisible({ timeout: 15000 });

        // Moderator claims and closes the report to clean up
        const claimButton = await expectOGSClickableByName(modPage, /Claim/i);
        await claimButton.click();
        await modPage.waitForTimeout(1000);

        const closeButton = await expectOGSClickableByName(modPage, /Close as good report/i);
        await closeButton.click();

        await modPage.waitForTimeout(2000);

        await tracker.assertCountReturnedToInitial(reporterPage);

        await modContext.close();
    });
};
