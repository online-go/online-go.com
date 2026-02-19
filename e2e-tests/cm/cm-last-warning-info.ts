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

// cspell:words LWARN

/*
 * Tests that ViewReport shows "Last warned" info when a player has been
 * previously warned for the same type of offense.
 *
 * Uses init_e2e data:
 * - E2E_CM_LWARN_V1, E2E_CM_LWARN_V2, E2E_CM_LWARN_V3 : CMs with sandbagging power
 *
 * Creates dynamically:
 * - accused user (game thrower) - fresh each run to stay as beginner
 * - opponent user - fresh each run
 * - reporter user - fresh each run
 * - games between accused and opponent
 *
 * Note: We use "sandbagging" reports because the accused resigns (loses), and
 * the backend auto-converts sandbagging reports to "thrown_game" when the
 * accused lost. This avoids the "escaping" report type's frontend validation
 * that rejects games ending by resignation.
 *
 * Flow:
 * 1. Play a game, accused resigns (loses)
 * 2. Reporter reports accused for "sandbagging" (converts to "thrown_game")
 * 3. 3 CMs vote "warn_thrown_game" -> warning issued, report resolves
 * 4. Accused acknowledges the warning
 * 5. Play 2 more games
 * 6. Reporter reports accused for "sandbagging" again (converts to "thrown_game")
 * 7. CM views the new report and verifies "Last warned" info is shown
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

const BLITZ_9X9_SETTINGS = {
    ...defaultChallengeSettings,
    gameName: "E2E LWARN Game",
    boardSize: "9x9" as const,
    speed: "blitz" as const,
    timeControl: "byoyomi" as const,
    mainTime: "2",
    timePerPeriod: "2",
    periods: "1",
};

const MOVES_9X9 = ["D5", "E5", "D6", "E6", "D7", "E7", "D8", "E8"];

/**
 * Play a quick 9x9 game between two users and end it by resignation.
 * The challenger resigns (loses).
 * Returns the game URL.
 */
async function playAndResignGame(
    challengerPage: Awaited<ReturnType<typeof prepareNewUser>>["userPage"],
    acceptorPage: Awaited<ReturnType<typeof prepareNewUser>>["userPage"],
    opponentUsername: string,
): Promise<string> {
    await createDirectChallenge(challengerPage, opponentUsername, BLITZ_9X9_SETTINGS);
    await acceptDirectChallenge(acceptorPage);

    // Wait for the game to start
    const goban = challengerPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    await playMoves(challengerPage, acceptorPage, MOVES_9X9, "9x9", 0);
    await resignActiveGame(challengerPage);

    return challengerPage.url();
}

export const cmLastWarningInfoTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    // Create users
    const accusedUsername = newTestUsername("LWARNAcc"); // cspell:disable-line
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    const opponentUsername = newTestUsername("LWARNOth"); // cspell:disable-line
    const { userPage: opponentPage } = await prepareNewUser(
        createContext,
        opponentUsername,
        "test",
    );

    const reporterUsername = newTestUsername("LWARNRep"); // cspell:disable-line
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        reporterUsername,
        "test",
    );

    await withReportCountTracking(reporterPage, testInfo, async (tracker) => {
        // ========================================
        // Phase 1: Play game and create a report
        // ========================================

        // Accused challenges opponent and resigns (accused loses)
        const gameUrl = await playAndResignGame(accusedPage, opponentPage, opponentUsername);

        // Reporter navigates to the game to see the accused player's name
        await reporterPage.goto(gameUrl);
        const reporterGoban = reporterPage.locator(".Goban[data-pointers-bound]");
        await reporterGoban.waitFor({ state: "visible" });

        // Wait for the Player link to be ready
        const playerLink = reporterPage.locator(
            `a.Player[data-ready="true"]:has-text("${accusedUsername}")`,
        );
        await expect(playerLink.first()).toBeVisible({ timeout: 15000 });

        // Report for "sandbagging" — since the accused lost, backend converts to "thrown_game"
        await reportUser(
            reporterPage,
            accusedUsername,
            "sandbagging",
            "E2E test: reporting for last-warning-info test, deliberate loss.",
        );

        await tracker.assertCountIncreasedBy(reporterPage, 1);

        const reportANumber = await captureReportNumber(reporterPage);

        // ========================================
        // Phase 2: 3 CMs vote to warn the game thrower
        // ========================================

        const cmVoters = ["E2E_CM_LWARN_V1", "E2E_CM_LWARN_V2", "E2E_CM_LWARN_V3"];
        const cmContexts = [];

        for (const cmUser of cmVoters) {
            const { seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
                createContext,
                cmUser,
            );
            cmContexts.push({ cmPage, cmContext });

            await navigateToReport(cmPage, reportANumber);

            // Verify the report type was converted to "Thrown Game"
            const reportTypeSelector = cmPage.locator(".report-type-selector");
            await expect(reportTypeSelector).toContainText("Thrown Game");

            // Verify the report is visible with our note
            await expect(
                cmPage.getByText(
                    "E2E test: reporting for last-warning-info test, deliberate loss.",
                ),
            ).toBeVisible();

            // Vote to warn the thrown game player
            await cmPage.locator('input[value="warn_thrown_game"]').click();

            const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
            await voteButton.click();
        }

        // ========================================
        // Phase 3: Accused acknowledges the warning
        // ========================================

        await accusedPage.waitForTimeout(3000);
        await accusedPage.goto("/");

        await expect(accusedPage.locator("div.AccountWarning")).toBeVisible({
            timeout: 15000,
        });

        // Since accused is a new user (<10 games), they get "warn_beginner_thrown_game"
        await expect(
            accusedPage
                .locator("div.AccountWarning")
                .locator("div.canned-message.warn_beginner_thrown_game"),
        ).toBeVisible();

        // Click the checkbox to confirm reading the warning
        await accusedPage.locator("div.AccountWarning").locator("input[type='checkbox']").click();

        // Wait for the timer to expire and OK button to become enabled
        const warningOkButton = accusedPage.locator("div.AccountWarning").locator("button.primary");
        await expect(warningOkButton).toBeVisible();
        await expect(warningOkButton).toBeEnabled({ timeout: 15000 });
        await warningOkButton.click();

        await expect(accusedPage.locator("div.AccountWarning")).not.toBeVisible();

        // Reporter also gets an acknowledgement about the educated beginner thrown game
        await reporterPage.goto("/");
        await expect(reporterPage.locator("div.AccountWarningAck")).toBeVisible({
            timeout: 15000,
        });
        const reporterOkButton = reporterPage
            .locator("div.AccountWarningAck")
            .locator("button.primary");
        await expect(reporterOkButton).toBeEnabled();
        await reporterOkButton.click();
        await expect(reporterPage.locator("div.AccountWarningAck")).not.toBeVisible();

        await tracker.assertCountReturnedToInitial(reporterPage);

        // ========================================
        // Phase 4: Play 2 more games after the warning
        // ========================================

        // Game 2: opponent challenges accused, opponent resigns
        await createDirectChallenge(opponentPage, accusedUsername, BLITZ_9X9_SETTINGS);
        await acceptDirectChallenge(accusedPage);

        const goban2 = opponentPage.locator(".Goban[data-pointers-bound]");
        await goban2.waitFor({ state: "visible" });

        await playMoves(opponentPage, accusedPage, MOVES_9X9, "9x9", 0);
        await resignActiveGame(opponentPage);

        // Game 3: opponent challenges accused again, opponent resigns
        await createDirectChallenge(opponentPage, accusedUsername, BLITZ_9X9_SETTINGS);
        await acceptDirectChallenge(accusedPage);

        const goban3 = opponentPage.locator(".Goban[data-pointers-bound]");
        await goban3.waitFor({ state: "visible" });

        await playMoves(opponentPage, accusedPage, MOVES_9X9, "9x9", 0);
        await resignActiveGame(opponentPage);

        // ========================================
        // Phase 5: Create a second report and verify warning info
        // ========================================

        // For the second report, the accused needs to have lost the game again
        // so that the sandbagging report converts to thrown_game.
        // Play one more game where accused resigns (loses).
        const game4Url = await playAndResignGame(accusedPage, opponentPage, opponentUsername);

        await reporterPage.goto(game4Url);
        const reporterGoban2 = reporterPage.locator(".Goban[data-pointers-bound]");
        await reporterGoban2.waitFor({ state: "visible" });

        const playerLink2 = reporterPage.locator(
            `a.Player[data-ready="true"]:has-text("${accusedUsername}")`,
        );
        await expect(playerLink2.first()).toBeVisible({ timeout: 15000 });

        await reportUser(
            reporterPage,
            accusedUsername,
            "sandbagging",
            "E2E test: second report to verify last-warning-info display.",
        );

        await tracker.assertCountIncreasedBy(reporterPage, 1);

        const reportBNumber = await captureReportNumber(reporterPage);

        // A CM navigates to the new report and checks for warning info
        const { seededCMPage: verifierPage } = await setupSeededCM(
            createContext,
            "E2E_CM_LWARN_V1",
        );

        await navigateToReport(verifierPage, reportBNumber);

        // The "Last warned" info should be visible
        const lastWarningInfo = verifierPage.locator(".last-warning-info");
        await expect(lastWarningInfo).toBeVisible({ timeout: 15000 });

        // It should show "Last warned:" text
        await expect(lastWarningInfo).toContainText("Last warned for this:");

        // It should show "ago" (from moment humanize)
        await expect(lastWarningInfo).toContainText("ago");

        // It should show game count — we played 3 games after the warning
        // (Games 2, 3, and 4 all started after the warning was created)
        await expect(lastWarningInfo).toContainText("3 games since then");

        // ========================================
        // Phase 6: Resolve Report B so count returns to initial
        // ========================================

        // V1 is already on the report as verifierPage — vote
        await verifierPage.locator('input[value="warn_thrown_game"]').click();
        const v1VoteButton = await expectOGSClickableByName(verifierPage, /Vote$/);
        await v1VoteButton.click();

        // V2 and V3 vote
        for (const cmUser of ["E2E_CM_LWARN_V2", "E2E_CM_LWARN_V3"]) {
            const { seededCMPage: cmPage } = await setupSeededCM(createContext, cmUser);
            await navigateToReport(cmPage, reportBNumber);
            await cmPage.locator('input[value="warn_thrown_game"]').click();
            const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
            await voteButton.click();
        }

        // Accused acknowledges the second warning
        await accusedPage.waitForTimeout(3000);
        await accusedPage.goto("/");
        await expect(accusedPage.locator("div.AccountWarning")).toBeVisible({ timeout: 15000 });
        await accusedPage.locator("div.AccountWarning").locator("input[type='checkbox']").click();
        const warningOk2 = accusedPage.locator("div.AccountWarning").locator("button.primary");
        await expect(warningOk2).toBeEnabled({ timeout: 15000 });
        await warningOk2.click();
        await expect(accusedPage.locator("div.AccountWarning")).not.toBeVisible();

        // Reporter acknowledges the second ack
        await reporterPage.goto("/");
        await expect(reporterPage.locator("div.AccountWarningAck")).toBeVisible({ timeout: 15000 });
        const reporterOk2 = reporterPage.locator("div.AccountWarningAck").locator("button.primary");
        await expect(reporterOk2).toBeEnabled();
        await reporterOk2.click();
        await expect(reporterPage.locator("div.AccountWarningAck")).not.toBeVisible();

        await tracker.assertCountReturnedToInitial(reporterPage);
    });
};
