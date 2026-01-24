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

// cspell:words SBES

/*
 * Uses init_e2e data:
 * - E2E_CM_SBES_V1, E2E_CM_SBES_V2, E2E_CM_SBES_V3 : CMs with sandbagging power who vote
 *
 * Creates dynamically:
 * - accused user (sandbagger) - created fresh each run
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

export const cmVoteEscalateSandbaggingTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    // Create the accused (sandbagger)
    const accusedUsername = newTestUsername("SBESAcc"); // cspell:disable-line
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    // Create the other player (opponent)
    const otherUsername = newTestUsername("SBESOth"); // cspell:disable-line
    const { userPage: otherPage } = await prepareNewUser(createContext, otherUsername, "test");

    // Accused challenges the other player
    await createDirectChallenge(accusedPage, otherUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E SBES Game",
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
        newTestUsername("SBESRep"), // cspell:disable-line
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
            "E2E test reporting sandbagging for escalation: deliberate loss.", // min chars
        );

        // Verify reporter's count increased by 1
        await tracker.assertCountIncreasedBy(reporterPage, 1);

        // Capture the report number from the reporter's "My Own Reports" page
        const reportNumber = await captureReportNumber(reporterPage);

        // All 3 CMs vote to escalate to moderators for sandbagging assessment
        const cmVoters = ["E2E_CM_SBES_V1", "E2E_CM_SBES_V2", "E2E_CM_SBES_V3"];

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
                cmPage.getByText("E2E test reporting sandbagging for escalation: deliberate loss."),
            ).toBeVisible();

            // Select the "escalate to moderators for sandbagging assessment" option
            await cmPage.locator('input[value="escalate_sandbagging"]').click();

            const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
            await voteButton.click();
        }

        // After all 3 CMs vote to escalate, the report should be converted to sandbagging_assessment
        // Unlike other outcomes, escalation does NOT close the report or send an acknowledgement
        // The reporter's count should remain at 1 (report still open, just in moderator queue)
        await reporterPage.waitForTimeout(3000);

        // Verify the reporter's count has NOT decreased (report is still open)
        await tracker.assertCountIncreasedBy(reporterPage, 1);

        // Verify that a full moderator can see the escalated report
        const { seededModeratorPage: modPage, seededModeratorContext: modContext } =
            await setupSeededModerator(createContext);

        // Navigate directly to the specific report using the captured report number
        await navigateToReport(modPage, reportNumber);

        // Verify the escalated report content is visible
        // Use .first() because the report text may appear in multiple places (Card and content div)
        await expect(
            modPage
                .getByText("E2E test reporting sandbagging for escalation: deliberate loss.")
                .first(),
        ).toBeVisible({ timeout: 15000 });

        // Verify the report type has been changed to sandbagging_assessment
        // The report type selector should show "Sandbagging Assessment"
        await expect(modPage.locator(".report-type-selector")).toContainText(
            "Sandbagging Assessment",
        );

        // Verify the report shows the system notes about being escalated
        // Both the specific note from the action function and the generic "Actioned by" note should be present
        await expect(
            modPage
                .getByText("Sent to moderators due to CM vote for sandbagging assessment")
                .first(),
        ).toBeVisible();
        await expect(
            modPage.getByText("Actioned by community vote: escalate_sandbagging").first(),
        ).toBeVisible();

        // Clean up: close the moderator context
        await modContext.close();
    });
};
