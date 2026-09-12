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

/*
* Uses init_e2e data:

* - E2E_GAMES_BS_CM : user who will check the log
*/

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

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
import { passAndScoreGame, playMoves, waitForGameViewReady } from "@helpers/game-utils";
import { withReportCountTracking } from "@helpers/report-utils";

export const basicScoringTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const { userPage: challengerPage } = await prepareNewUser(
        createContext,
        newTestUsername("gamesBasicCh"), // cspell:disable-line
        "test",
    );

    const acceptorUsername = newTestUsername("gamesBasicAc"); // cspell:disable-line
    const { userPage: acceptorPage } = await prepareNewUser(
        createContext,
        acceptorUsername,
        "test",
    );

    // Challenger challenges the acceptor
    await createDirectChallenge(challengerPage, acceptorUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E Games Basic Scoring Test Game",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "300",
        timePerPeriod: "30",
        periods: "5",
        ranked: false,
    });

    // escaper accepts
    await acceptDirectChallenge(acceptorPage);

    const moves = [
        "D9",
        "E9",
        "D8",
        "E8",
        "D7",
        "E7",
        "D6",
        "E6",
        "D5",
        "E5",
        "D4",
        "E4",
        "D3",
        "E3",
        "D2",
        "E2",
        "D1",
        "E1",
    ];

    await playMoves(challengerPage, acceptorPage, moves, "9x9");

    await passAndScoreGame(challengerPage, acceptorPage);

    // Wait for the post-game view to settle (PlayerCard avatars, AIReview)
    // before opening PlayerDetails.
    await waitForGameViewReady(challengerPage);

    // Use tracker to handle variable initial report count
    await withReportCountTracking(challengerPage, testInfo, async (reporterTracker) => {
        // Set up CM and capture their baseline BEFORE creating the report
        const cm = "E2E_GAMES_BS_CM";
        const { seededCMPage: cmPage } = await setupSeededCM(createContext, cm);

        // Create a report so we can check the log
        await reportUser(
            challengerPage,
            "e2egamesBasicA", // cspell:disable-line - Truncated to match UI display (15 char limit)
            "score_cheating",
            "E2E test reporting a score cheat",
        );

        // Verify report was created (reporter's count increased by 1)
        const reportIndicator = await reporterTracker.assertCountIncreasedBy(challengerPage, 1);

        // Capture the report number from the reporter's "My Own Reports" page
        const reportNumber = await captureReportNumber(challengerPage);

        // Navigate CM directly to the report
        await navigateToReport(cmPage, reportNumber);

        await expect(cmPage.getByText("E2E test reporting a score cheat")).toBeVisible();

        const events = cmPage.locator("tr.entry td.event");
        await expect(events.nth(0)).toHaveText("game ended");
        await expect(events.nth(1)).toHaveText("stone removal stones accepted");
        await expect(events.nth(2)).toHaveText("stone removal stones accepted");

        // Clean up the report
        await reportIndicator.click();

        // Get the Cancel button from the banner (reporter's view), not from ReportsCenterContainer
        const cancelButton = challengerPage
            .getByRole("banner")
            .locator("button.reject.xs", { hasText: "Cancel" });
        await expect(cancelButton).toBeVisible();
        await cancelButton.click();

        // Verify count returned to initial baseline
        await reporterTracker.assertCountReturnedToInitial(challengerPage);
    });
};
