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

// cspell:words SBWA

/*
 * Uses init_e2e data:
 * - E2E_CM_SBWA_V1, E2E_CM_SBWA_V2, E2E_CM_SBWA_V3 : CMs with sandbagging power who vote
 *
 * Creates dynamically:
 * - accused user (sandbagger) - created fresh each run to stay as beginner
 * - other user (opponent) - created fresh each run
 * - game between them that ends by resignation
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

export const cmVoteWarnAnnulSandbaggingTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    // Create the accused (sandbagger) - keep this page/context for later warning check
    const accusedUsername = newTestUsername("SBWAAcc"); // cspell:disable-line
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    // Create the other player (opponent)
    const otherUsername = newTestUsername("SBWAOth"); // cspell:disable-line
    const { userPage: otherPage } = await prepareNewUser(createContext, otherUsername, "test");

    // Accused challenges the other player
    await createDirectChallenge(accusedPage, otherUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E SBWA Game",
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

    // Accused resigns (simulating sandbagging - deliberate loss)
    await resignActiveGame(accusedPage);

    // Capture the game URL for the reporter to navigate to
    const gameUrl = accusedPage.url();

    // Create the reporter
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        newTestUsername("SBWARep"), // cspell:disable-line
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

        await reportUser(
            reporterPage,
            accusedUsername,
            "sandbagging",
            "E2E test reporting sandbagging for annulment: deliberate loss.", // min chars
        );

        // Verify reporter's count increased by 1
        await tracker.assertCountIncreasedBy(reporterPage, 1);

        // Capture the report number from the reporter's "My Own Reports" page
        const reportNumber = await captureReportNumber(reporterPage);

        // All 3 CMs vote to warn and annul the sandbagged game
        const cmVoters = ["E2E_CM_SBWA_V1", "E2E_CM_SBWA_V2", "E2E_CM_SBWA_V3"];

        const cmContexts = [];
        for (const cmUser of cmVoters) {
            const { seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
                createContext,
                cmUser,
            );

            cmContexts.push({ cmPage, cmContext }); // keep them alive for the duration of the test

            // Navigate directly to the report using the captured report number
            await navigateToReport(cmPage, reportNumber);

            // Verify we can see the report with the message
            await expect(
                cmPage.getByText("E2E test reporting sandbagging for annulment: deliberate loss."),
            ).toBeVisible();

            // Select the "annul sandbagged game and warn" option
            await cmPage.locator('input[value="annul_sandbagged"]').click();

            const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
            await voteButton.click();
        }

        // After all 3 CMs vote, the reporter should receive an acknowledgement
        // Wait a moment for the acknowledgement to be generated
        await reporterPage.waitForTimeout(3000);

        // The reporter should see the acknowledgement about warned sandbagger and annulled game
        await reporterPage.goto("/");

        await expect(reporterPage.locator("div.AccountWarningAck")).toBeVisible({
            timeout: 15000,
        });

        // Check for the annulled version of the acknowledgement message
        // Since the reporter is a new user (<10 games), they get the "educated beginner" version
        await expect(
            reporterPage
                .locator("div.AccountWarningAck")
                .locator("div.canned-message.ack_educated_beginner_sandbagger_and_annul"),
        ).toBeVisible();

        const okButton = reporterPage.locator("div.AccountWarningAck").locator("button.primary");
        await expect(okButton).toBeVisible();
        await expect(okButton).toBeEnabled();

        await okButton.click();

        await expect(reporterPage.locator("div.AccountWarningAck")).not.toBeVisible();

        // After clicking OK on the acknowledgement, the count should return to initial
        await tracker.assertCountReturnedToInitial(reporterPage);

        // Verify the accused person received the warning
        // (accused is already logged in from the game we played)
        await accusedPage.goto("/");

        // The accused should see a warning about sandbagging
        await expect(accusedPage.locator("div.AccountWarning")).toBeVisible({
            timeout: 15000,
        });

        // Check for the beginner warning message (new user has <10 games)
        await expect(
            accusedPage
                .locator("div.AccountWarning")
                .locator("div.canned-message.warn_beginner_sandbagger"),
        ).toBeVisible();

        // Warnings require clicking a checkbox to confirm you've read it
        await accusedPage.locator("div.AccountWarning").locator("input[type='checkbox']").click();

        // The OK button starts disabled and has a timer before it becomes enabled
        const warningOkButton = accusedPage.locator("div.AccountWarning").locator("button.primary");
        await expect(warningOkButton).toBeVisible();
        await expect(warningOkButton).toBeDisabled();

        // Wait for the warning timer to expire and OK button to become enabled
        await expect(warningOkButton).toBeEnabled({ timeout: 15000 });

        await warningOkButton.click();

        await expect(accusedPage.locator("div.AccountWarning")).not.toBeVisible();
    });
};
