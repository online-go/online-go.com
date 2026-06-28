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

// cspell:words ERPB

/*
 * Tests the predictive badge boundary: a player with 2 prior confirmed
 * escapes (both informal) opens a third escaping report. The predictive
 * count is 3, which crosses the 3% threshold, so:
 *   - the badge reads "Escaping too much"
 *   - the displayed count is "3 escapes in 3 games"
 *   - formal-warn vote options ARE present
 *   - informal-warn vote options are NOT present
 *
 * Uses init_e2e CM voters from the existing escape-rate display test:
 *   E2E_CM_ERH_V1, E2E_CM_ERH_V2, E2E_CM_ERH_V3.
 *
 * Creates dynamically per run:
 *   - accused user
 *   - reporter user
 *   - 3 games
 *   - 2 escaping reports on games 1-2 resolved by 3 CMs voting
 *     informal_warn_escaper
 *   - 1 open escaping report on game 3 (the one we inspect)
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, Page, TestInfo } from "@playwright/test";

import {
    captureReportNumber,
    goToUsersFinishedGame,
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

import { playMoves } from "@helpers/game-utils";

import { expectOGSClickableByName } from "@helpers/matchers";
import { expect } from "@playwright/test";

import { dismissWarningDialogs, withReportCountTracking } from "@helpers/report-utils";

const CM_VOTERS = ["E2E_CM_ERH_V1", "E2E_CM_ERH_V2", "E2E_CM_ERH_V3"];

async function playAndFinishGame(
    reporterPage: Page,
    accusedPage: Page,
    accusedUsername: string,
    gameIndex: number,
): Promise<void> {
    const gameName = `E2E ERPB Game ${gameIndex}`;
    // Override defaultChallengeSettings' 2s/2s blitz timing — under a loaded
    // dev stack the 4-move play sequence can exhaust either player's time
    // and end the game by timeout rather than pass+accept, leaving the test
    // waiting forever on the "Pass"/"Accept" buttons. 60s main + 1×10s
    // byoyomi gives ample headroom while still being "live" speed.
    await createDirectChallenge(reporterPage, accusedUsername, {
        ...defaultChallengeSettings,
        gameName,
        boardSize: "9x9",
        speed: "live",
        mainTime: "60",
        timePerPeriod: "10",
        periods: "1",
        color: "black",
    });

    await acceptDirectChallenge(accusedPage);

    const goban = reporterPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    await playMoves(reporterPage, accusedPage, ["D5", "E5", "D6", "E6"], "9x9");

    await reporterPage.getByText("Pass", { exact: true }).click();
    await accusedPage.getByText("Pass", { exact: true }).click();

    const accusedAccept = accusedPage.getByText("Accept");
    await expect(accusedAccept).toBeVisible();
    await accusedAccept.click();

    const reporterAccept = reporterPage.getByText("Accept");
    await expect(reporterAccept).toBeVisible();
    await reporterAccept.click();

    await expect(reporterPage.getByText("wins by")).toBeVisible();

    // The reporter UI has the goban in "finished" phase, but the server's
    // Game.ended write may not be committed yet. Filing an escaping report
    // before that lands gets rejected by moderate.py:714-725 (HTTP 400).
    // Navigate via the accused's finished-game list — the game only appears
    // there once the DB has Game.ended set — then load the game page fresh.
    await goToUsersFinishedGame(reporterPage, accusedUsername, gameName);
    await expect(reporterPage.locator(".game-state")).toContainText("wins by");
}

async function reportAndVote(
    reporterPage: Page,
    cmPages: Page[],
    voteAction: string,
): Promise<void> {
    await reportPlayerByColor(
        reporterPage,
        ".white",
        "escaping",
        "E2E test: player escaped this game",
    );

    const reportNumber = await captureReportNumber(reporterPage);

    for (const cmPage of cmPages) {
        await navigateToReport(cmPage, reportNumber);
        await cmPage.locator(`input[value="${voteAction}"]`).click();
        const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
        await voteButton.click();
    }
}

export const cmEscapeRatePredictiveBorderlineTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const TIMEOUT_MS = 360 * 1000;

    const accusedUsername = newTestUsername("ERPBAcc"); // cspell:disable-line
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    const reporterUsername = newTestUsername("ERPBRep"); // cspell:disable-line
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        reporterUsername,
        "test",
    );

    await withReportCountTracking(
        reporterPage,
        testInfo,
        async (tracker) => {
            const cmPages: Page[] = [];
            const cmContexts: BrowserContext[] = [];
            for (const cmUser of CM_VOTERS) {
                const { seededCMPage, seededCMContext } = await setupSeededCM(
                    createContext,
                    cmUser,
                );
                cmPages.push(seededCMPage);
                cmContexts.push(seededCMContext);
            }

            // Games 1-2: file, vote informal_warn_escaper -> 2 prior confirmed escapes.
            for (let i = 1; i <= 2; i++) {
                await playAndFinishGame(reporterPage, accusedPage, accusedUsername, i);
                await reportAndVote(reporterPage, cmPages, "informal_warn_escaper");
                await accusedPage.goto("/");
                await dismissWarningDialogs(accusedPage);
                await dismissWarningDialogs(reporterPage);
            }

            // Game 3: file but leave open -- this is the report we inspect.
            await playAndFinishGame(reporterPage, accusedPage, accusedUsername, 3);

            await reportPlayerByColor(
                reporterPage,
                ".white",
                "escaping",
                "E2E test: player escaped (report 3, borderline)",
            );

            await tracker.assertCountIncreasedBy(reporterPage, 1);

            const reportNumber = await captureReportNumber(reporterPage);

            const cmPage = cmPages[0];
            await navigateToReport(cmPage, reportNumber);

            // Header: "IF this is escaping:"
            const conditionalHeader = cmPage.locator(".escape-rate-conditional-header");
            await expect(conditionalHeader).toBeVisible({ timeout: 15000 });
            await expect(conditionalHeader).toContainText("IF this is escaping:");

            // Predicted count: 2 prior + 1 current = 3 in 3 games
            const detail = cmPage.locator(".escape-rate-detail");
            await expect(detail).toContainText("3 escapes in 3 games");

            // Badge: "Escaping too much" (red)
            const badge = cmPage.locator(".escape-rate-badge.escaping-too-much");
            await expect(badge).toBeVisible();
            await expect(badge).toContainText("Escaping too much");

            // Formal-warn vote option present
            const formalVote = cmPage.locator('input[value="warn_escaper"]');
            await expect(formalVote).toBeVisible();

            // Informal-warn vote options absent
            const informalVote = cmPage.locator('input[value="informal_warn_escaper"]');
            await expect(informalVote).toHaveCount(0);
            const informalAnnulVote = cmPage.locator(
                'input[value="informal_warn_escaper_and_annul"]',
            );
            await expect(informalAnnulVote).toHaveCount(0);

            for (const ctx of cmContexts) {
                await ctx.close();
            }

            // Clean up: cancel the open report so we leave a tidy state.
            await reporterPage.goto("/reports-center");
            const myReports = reporterPage.getByText("My Own Reports");
            await expect(myReports).toBeVisible();
            await myReports.click();

            const cancelButton = await expectOGSClickableByName(reporterPage, /Cancel$/);
            await cancelButton.click();

            await tracker.assertCountReturnedToInitial(reporterPage);
        },
        TIMEOUT_MS,
    );
};
