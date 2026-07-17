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

// cspell:words STALL

/*
 * Resolving a STALLING report via "call the game for black" must warn the
 * accused as a STALLER, not an escaper. Guards the warn_escaper -> warn_staller
 * fix in voted_call_stalled_game_for_black/white (moderation.py:1211,1225):
 * before that fix this test fails, because the accused receives a beginner
 * ESCAPER warning.
 *
 * Flow:
 *  - Reporter (black) and accused (white) start a live game; play 2 moves so a
 *    stalling report is applicable, and leave the game in progress.
 *  - Reporter files a stalling report on the accused.
 *  - 3 CMs (stalling power) vote call_stalled_game_for_black; consensus decides
 *    the game for black and warns white.
 *  - The accused's warning is the beginner STALLER message, not an escaper one.
 *
 * Uses init_e2e seeded CMs E2E_CM_STALL_V1/V2/V3 (stalling power).
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

import {
    captureReportNumber,
    navigateToReport,
    newTestUsername,
    prepareNewUser,
    reportPlayerByColor,
    setupSeededCM,
} from "@helpers/user-utils";

import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";

import { playMoves, waitForGameViewReady } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";
import { dismissWarningDialogs, withReportCountTracking } from "@helpers/report-utils";

const CM_VOTERS = ["E2E_CM_STALL_V1", "E2E_CM_STALL_V2", "E2E_CM_STALL_V3"];

export const cmCallStalledGameWarnsStallerTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const TIMEOUT_MS = 180 * 1000;

    const accusedUsername = newTestUsername("STALLAcc"); // cspell:disable-line
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    const reporterUsername = newTestUsername("STALLRep"); // cspell:disable-line
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        reporterUsername,
        "test",
    );

    await withReportCountTracking(
        reporterPage,
        testInfo,
        async (tracker) => {
            // Live game: generous main time so it stays in progress through
            // three CM votes (a timeout would end it as an escape, not a stall).
            await createDirectChallenge(reporterPage, accusedUsername, {
                ...defaultChallengeSettings,
                gameName: "E2E STALL call-game",
                boardSize: "9x9",
                speed: "live",
                mainTime: "300",
                timePerPeriod: "30",
                periods: "5",
                color: "black",
            });
            await acceptDirectChallenge(accusedPage);

            const goban = reporterPage.locator(".Goban[data-pointers-bound]");
            await goban.waitFor({ state: "visible" });

            // Two moves make a stalling report applicable (moves.length >= 2);
            // the game is left in progress.
            await playMoves(reporterPage, accusedPage, ["D5", "E5"], "9x9");

            // AI review does not render mid-game.
            await waitForGameViewReady(reporterPage, { aiReviewExpected: false });

            // File the stalling report on white (the accused). Note >= 20 chars.
            await reportPlayerByColor(
                reporterPage,
                ".white",
                "stalling",
                "E2E test: white is stalling the end of this live game",
            );
            await tracker.assertCountIncreasedBy(reporterPage, 1);
            const reportNumber = await captureReportNumber(reporterPage);

            // 3 CMs vote to call the game for black — consensus resolves it.
            for (const cmUser of CM_VOTERS) {
                const { seededCMPage, seededCMContext } = await setupSeededCM(
                    createContext,
                    cmUser,
                );
                await navigateToReport(seededCMPage, reportNumber);
                await seededCMPage.locator(`input[value="call_stalled_game_for_black"]`).click();
                const voteButton = await expectOGSClickableByName(seededCMPage, /Vote$/);
                await voteButton.click();
                await seededCMContext.close();
            }

            // Surface the warning on the accused's client.
            await accusedPage.goto("/");

            // The accused is warned as a STALLER (beginner variant for a new
            // account), never as an escaper.
            const stallerWarning = accusedPage.locator(
                "div.AccountWarning .canned-message.warn_beginner_staller",
            );
            await expect(stallerWarning).toBeVisible({ timeout: 15000 });
            await expect(stallerWarning).toContainText("delayed the end of game");

            await expect(accusedPage.locator(".canned-message.warn_beginner_escaper")).toHaveCount(
                0,
            );
            await expect(accusedPage.locator(".canned-message.warn_escaper")).toHaveCount(0);

            // Dismiss so the account is left clean; the report is already
            // resolved by consensus, so the reporter's count returns to initial.
            await dismissWarningDialogs(accusedPage);
            await tracker.assertCountReturnedToInitial(reporterPage);
        },
        TIMEOUT_MS,
    );
};
