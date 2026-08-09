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

// cspell:words NTC

/*
 * Uses init_e2e data:
 * - E2E_CM_NTC_V1, E2E_CM_NTC_V2, E2E_CM_NTC_V3 : CMs with sandbagging power who vote
 *
 * Creates dynamically:
 * - accused user (the canceller) - created fresh each run
 * - other user (opponent) - created fresh each run
 * - reporter - created fresh each run
 * - game between accused and opponent that ends by cancellation
 *
 * Cancelling records the canceller as the loser, so a "sandbagging" report
 * against them is converted by the backend into a "thrown_game" report. This
 * test verifies that CMs can close such a report with "not a thrown game,
 * they used cancel", and that the reporter is told what actually happened.
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, TestInfo } from "@playwright/test";

import {
    captureReportNumber,
    goToFinishedGameUrl,
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

import { cancelActiveGame, playMoves } from "@helpers/game-utils";

import { expectOGSClickableByName } from "@helpers/matchers";
import { expect } from "@playwright/test";

import { withReportCountTracking } from "@helpers/report-utils";

export const cmVoteNotThrownCancelledTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    // Create the accused (who will cancel the game)
    const accusedUsername = newTestUsername("NTCAcc"); // cspell:disable-line
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    // Create the other player (opponent)
    const otherUsername = newTestUsername("NTCOth"); // cspell:disable-line
    const { userPage: otherPage } = await prepareNewUser(createContext, otherUsername, "test");

    // Generous time controls: the game must not time out before it is cancelled,
    // because a Timeout ending would not exercise the cancellation path.
    await createDirectChallenge(accusedPage, otherUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E NTC Game",
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

    // Two moves keeps the game inside the cancellation window
    // (GobanEngine.gameCanBeCancelled allows up to 6 moves in a non-handicap game).
    await playMoves(accusedPage, otherPage, ["D5", "E5"], "9x9", 0);

    // The accused cancels. This must be the accused: the canceller is recorded
    // as the loser, and the sandbagging-to-thrown-game conversion keys off that.
    await cancelActiveGame(accusedPage);

    // Capture the game URL for the reporter to navigate to
    const gameUrl = accusedPage.url();

    // Create the reporter
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        newTestUsername("NTCRep"), // cspell:disable-line
        "test",
    );

    await withReportCountTracking(reporterPage, testInfo, async (tracker) => {
        // A two-move cancelled game gets no AI review, so don't wait for one.
        await goToFinishedGameUrl(reporterPage, gameUrl, { aiReviewExpected: false });

        // Reporter submits a "sandbagging" report - the backend converts it to
        // "thrown_game" because the accused is recorded as having lost.
        await reportUser(
            reporterPage,
            accusedUsername,
            "sandbagging",
            "E2E test reporting sandbagging: they threw the game by quitting.", // min chars
        );

        // Verify reporter's count increased by 1
        await tracker.assertCountIncreasedBy(reporterPage, 1);

        // Capture the report number from the reporter's "My Own Reports" page
        const reportNumber = await captureReportNumber(reporterPage);

        // All 3 CMs vote that this was a cancellation, not a thrown game
        const cmVoters = ["E2E_CM_NTC_V1", "E2E_CM_NTC_V2", "E2E_CM_NTC_V3"];

        const cmContexts = [];
        for (const cmUser of cmVoters) {
            const { seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
                createContext,
                cmUser,
            );

            cmContexts.push({ cmPage, cmContext }); // keep them alive for the duration of the test

            await navigateToReport(cmPage, reportNumber);

            // The cancellation path must produce a Thrown Game report - if this
            // assertion fails the conversion in moderate.py did not fire.
            const reportTypeSelector = cmPage.locator(".report-type-selector");
            await expect(reportTypeSelector).toContainText("Thrown Game");

            await expect(
                cmPage.getByText(
                    "E2E test reporting sandbagging: they threw the game by quitting.",
                ),
            ).toBeVisible();

            // Select "Not a thrown game - they used 'cancel'."
            await cmPage.locator('input[value="not_thrown_game_cancel"]').click();

            const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
            await voteButton.click();
        }

        // After all 3 CMs vote, the reporter should receive an acknowledgement
        await reporterPage.waitForTimeout(3000);

        await reporterPage.goto("/");

        await expect(reporterPage.locator("div.AccountWarningAck")).toBeVisible({
            timeout: 15000,
        });

        await expect(
            reporterPage
                .locator("div.AccountWarningAck")
                .locator("div.canned-message.not_thrown_game_cancel"),
        ).toBeVisible();

        const okButton = reporterPage.locator("div.AccountWarningAck").locator("button.primary");
        await expect(okButton).toBeVisible();
        await expect(okButton).toBeEnabled(); // acks are enabled immediately

        await okButton.click();

        await expect(reporterPage.locator("div.AccountWarningAck")).not.toBeVisible();

        // After clicking OK on the acknowledgement, the count should return to initial
        await tracker.assertCountReturnedToInitial(reporterPage);

        // The whole point of "not a thrown game - they used cancel" is that the
        // accused gets no warning: cancelling in the opening is permitted, not
        // sanctioned. Reload so any warning issued after consensus has a chance
        // to appear, then confirm none did.
        await accusedPage.goto("/");
        await expect(accusedPage.locator("div.AccountWarning")).not.toBeVisible();
    });
};
