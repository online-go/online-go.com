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
import { playMoves } from "@helpers/game-utils";
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
        mainTime: "45",
        timePerPeriod: "10",
        periods: "1",
    });

    // escaper accepts
    await acceptDirectChallenge(acceptorPage);

    // Challenger is black
    // Wait for the Goban to be visible & definitely ready
    const goban = challengerPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    await challengerPage.waitForTimeout(1000);

    // Wait for the game state to indicate it's the challenger's move
    let challengersMove = challengerPage.getByText("Your move", { exact: true });
    await expect(challengersMove).toBeVisible();

    challengersMove = challengerPage.getByText("Your move", { exact: true });
    await expect(challengersMove).toBeVisible();

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

    const challengerPass = challengerPage.getByText("Pass", { exact: true });
    await expect(challengerPass).toBeVisible();

    await challengerPass.click();

    const acceptorPass = acceptorPage.getByText("Pass", { exact: true });
    await expect(acceptorPass).toBeVisible();

    await acceptorPass.click();

    const acceptorAccept = acceptorPage.getByText("Accept");
    await expect(acceptorAccept).toBeVisible();

    await acceptorAccept.click();

    const challengerAccept = challengerPage.getByText("Accept");
    await expect(challengerAccept).toBeVisible();

    await challengerAccept.click();

    const acceptorFinished = acceptorPage.getByText("wins by");
    await expect(acceptorFinished).toBeVisible();

    const challengerFinished = challengerPage.getByText("wins by");
    await expect(challengerFinished).toBeVisible();

    // Use tracker to handle variable initial report count
    await withReportCountTracking(challengerPage, testInfo, async (reporterTracker) => {
        // Set up CM and capture their baseline BEFORE creating the report
        const cm = "E2E_GAMES_BS_CM";
        const { seededCMPage: cmPage } = await setupSeededCM(createContext, cm);

        // Capture CM's initial count
        const cmInitialCount = await reporterTracker.checkCurrentCount(cmPage);

        // Create a report so we can check the log
        await reportUser(
            challengerPage,
            "e2egamesBasicA", // cspell:disable-line
            "score_cheating",
            "E2E test reporting a score cheat",
        );

        // Verify report was created (reporter's count increased by 1)
        const reportIndicator = await reporterTracker.assertCountIncreasedBy(challengerPage, 1);

        // Capture the report number from the reporter's "My Own Reports" page
        const reportNumber = await captureReportNumber(challengerPage);

        // Verify CM's count also increased by 1
        const cmCurrentCount = await reporterTracker.checkCurrentCount(cmPage);
        expect(cmCurrentCount).toBe(cmInitialCount + 1);

        // Navigate CM directly to the report
        await navigateToReport(cmPage, reportNumber);

        await expect(cmPage.getByText("E2E test reporting a score cheat")).toBeVisible();

        const events = await cmPage.locator("tr.entry td.event").allTextContents();
        expect(events[0].trim()).toBe("game ended");
        expect(events[1].trim()).toBe("stone removal stones accepted");
        expect(events[2].trim()).toBe("stone removal stones accepted");

        // Clean up the report
        await reportIndicator.click();

        // Get the Cancel button from the banner (reporter's view), not from ReportsCenterContainer
        const cancelButton = challengerPage
            .getByRole("banner")
            .locator("button.reject.xs", { hasText: "Cancel" });
        await expect(cancelButton).toBeVisible();
        await cancelButton.click();

        // Wait for the report to be cancelled and UI to update
        await challengerPage.waitForLoadState("networkidle");

        // Verify count returned to initial baseline
        await reporterTracker.assertCountReturnedToInitial(challengerPage);
    });
};
