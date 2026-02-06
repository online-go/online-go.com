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

// cspell:words NOSB

/*
 * Uses init_e2e data:
 * - E2E_CM_NOSB_V1, E2E_CM_NOSB_V2, E2E_CM_NOSB_V3 : CMs with sandbagging power who vote
 *
 * Creates dynamically:
 * - accused user (game thrower) - created fresh each run
 * - other user (opponent) - created fresh each run
 * - game between them that ends by resignation
 *
 * Note: When the reporter submits a "sandbagging" report and the accused player
 * LOST the game, the backend automatically converts it to a "thrown_game" report.
 * This test verifies that CMs can vote "no thrown game evident" when they believe
 * the loss was legitimate.
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

export const cmVoteNoSandbaggingTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    // Create the accused (who will lose but not intentionally)
    const accusedUsername = newTestUsername("NOSBAcc"); // cspell:disable-line
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    // Create the other player (opponent)
    const otherUsername = newTestUsername("NOSBOth"); // cspell:disable-line
    const { userPage: otherPage } = await prepareNewUser(createContext, otherUsername, "test");

    // Accused challenges the other player
    await createDirectChallenge(accusedPage, otherUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E NOSB Game",
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

    // Accused resigns - this means they LOST the game.
    // When reporter submits a "sandbagging" report, the backend will convert
    // it to "thrown_game" because the accused lost.
    await resignActiveGame(accusedPage);

    // Capture the game URL for the reporter to navigate to
    const gameUrl = accusedPage.url();

    // Create the reporter
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        newTestUsername("NOSBRep"), // cspell:disable-line
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

        // Reporter submits a "sandbagging" report - but since the accused lost,
        // the backend will convert this to a "thrown_game" report
        await reportUser(
            reporterPage,
            accusedUsername,
            "sandbagging",
            "E2E test reporting sandbagging: they lost on purpose.", // min chars
        );

        // Verify reporter's count increased by 1
        await tracker.assertCountIncreasedBy(reporterPage, 1);

        // Capture the report number from the reporter's "My Own Reports" page
        const reportNumber = await captureReportNumber(reporterPage);

        // All 3 CMs vote that there's no thrown game evident
        const cmVoters = ["E2E_CM_NOSB_V1", "E2E_CM_NOSB_V2", "E2E_CM_NOSB_V3"];

        const cmContexts = [];
        for (const cmUser of cmVoters) {
            const { seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
                createContext,
                cmUser,
            );

            cmContexts.push({ cmPage, cmContext }); // keep them alive for the duration of the test

            // Navigate directly to the report using the captured report number
            await navigateToReport(cmPage, reportNumber);

            // Verify the report type is shown as "Thrown Game" (converted from sandbagging)
            const reportTypeSelector = cmPage.locator(".report-type-selector");
            await expect(reportTypeSelector).toContainText("Thrown Game");

            // Verify we can see the report with the message
            await expect(
                cmPage.getByText("E2E test reporting sandbagging: they lost on purpose."),
            ).toBeVisible();

            // Select the "no thrown game evident - inform the reporter" option
            await cmPage.locator('input[value="no_thrown_game"]').click();

            const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
            await voteButton.click();
        }

        // After all 3 CMs vote, the reporter should receive an acknowledgement
        // Wait a moment for the acknowledgement to be generated
        await reporterPage.waitForTimeout(3000);

        // The reporter should see the "no thrown game evident" acknowledgement
        await reporterPage.goto("/");

        await expect(reporterPage.locator("div.AccountWarningAck")).toBeVisible({
            timeout: 15000,
        });

        await expect(
            reporterPage
                .locator("div.AccountWarningAck")
                .locator("div.canned-message.no_thrown_game_evident"),
        ).toBeVisible();

        const okButton = reporterPage.locator("div.AccountWarningAck").locator("button.primary");
        await expect(okButton).toBeVisible();
        await expect(okButton).toBeEnabled(); // acks are enabled immediately

        await okButton.click();

        await expect(reporterPage.locator("div.AccountWarningAck")).not.toBeVisible();

        // After clicking OK on the acknowledgement, the count should return to initial
        await tracker.assertCountReturnedToInitial(reporterPage);
    });
};
