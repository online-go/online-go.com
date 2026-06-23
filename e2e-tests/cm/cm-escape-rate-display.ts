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

// cspell:words ERATEH

/*
 * Tests that the escape rate advisory section displays correctly on
 * escaping reports, using real games and real CM-voted warnings.
 *
 * Uses init_e2e data:
 * - E2E_CM_ERH_V1, E2E_CM_ERH_V2, E2E_CM_ERH_V3 : CMs with escaping power
 *
 * Creates dynamically:
 * - accused user - created fresh each run
 * - reporter user - created fresh each run
 * - 5 games between reporter and accused
 * - 4 escaping reports on games 1-4, each resolved by 3 CM votes
 *   (2 informal warnings then 2 formal warnings)
 * - 1 open escaping report on game 5 (the one we test the display on)
 *
 * The 2-then-2 split is dictated by the predictive filter: the badge counts
 * the report under judgement, so as soon as a player has 2 prior confirmed
 * escapes, the predicted count for the next report is 3 — over the threshold —
 * and the informal-warn options are hidden. The test scenario therefore
 * walks the same staircase a real CM workflow does (2 informals, then formals
 * once the predictive threshold is reached).
 *
 * Expected display on report 5:
 * - "IF this is escaping:" predictive header
 * - "5 escapes in 5 games" (4 prior confirmed + 1 current report under judgement)
 * - "Escaping too much" badge (red) — predicted rate crosses the 3% threshold
 * - "Previously formally warned" (two formal warnings on record by this point)
 *
 * Flow:
 * 1. Play 5 games between reporter and accused (pass+accept to finish each)
 * 2. For games 1-2: file escaping report, 3 CMs vote informal_warn_escaper
 * 3. For games 3-4: file escaping report, 3 CMs vote warn_escaper (formal)
 * 4. For game 5: file escaping report (left open)
 * 5. CM views report 5 and verifies escape rate display
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, Page, TestInfo } from "@playwright/test";

import {
    captureReportNumber,
    navigateToReport,
    newTestUsername,
    prepareNewUser,
    reportPlayerByColor,
    setupSeededCM,
} from "@helpers/user-utils";

import { log } from "@helpers/logger";

import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";

import { playMoves } from "@helpers/game-utils";

import { expectOGSClickableByName } from "@helpers/matchers";
import { expect } from "@playwright/test";

import { withReportCountTracking } from "@helpers/report-utils";

const CM_VOTERS = ["E2E_CM_ERH_V1", "E2E_CM_ERH_V2", "E2E_CM_ERH_V3"];

/**
 * Play a 9x9 game between reporter (black) and accused (white),
 * ending by pass+accept. Returns the game URL.
 */
async function playAndFinishGame(
    reporterPage: Page,
    accusedPage: Page,
    accusedUsername: string,
    gameIndex: number,
): Promise<void> {
    // Override defaultChallengeSettings' 2s/2s blitz timing — under a loaded
    // dev stack the 4-move play sequence can exhaust either player's time
    // and end the game by timeout rather than pass+accept, leaving the test
    // waiting forever on the "Pass"/"Accept" buttons. 60s main + 1×10s
    // byoyomi gives ample headroom while still being "live" speed.
    await createDirectChallenge(reporterPage, accusedUsername, {
        ...defaultChallengeSettings,
        gameName: `E2E ERH Game ${gameIndex}`,
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

    // Play a few moves (need >= 2 for escaping report applicability)
    await playMoves(reporterPage, accusedPage, ["D5", "E5", "D6", "E6"], "9x9");

    // End the game: both pass, both accept scoring
    await reporterPage.getByText("Pass", { exact: true }).click();
    await accusedPage.getByText("Pass", { exact: true }).click();

    const accusedAccept = accusedPage.getByText("Accept");
    await expect(accusedAccept).toBeVisible();
    await accusedAccept.click();

    const reporterAccept = reporterPage.getByText("Accept");
    await expect(reporterAccept).toBeVisible();
    await reporterAccept.click();

    await expect(reporterPage.getByText("wins by")).toBeVisible();

    // Five sequential games + reports overload the dev stack: the server's
    // Game.ended write trails behind the WS phase-finished event the goban
    // already rendered, so the next escaping report on this game gets
    // rejected by moderate.py:714-725 (HTTP 400). A deliberate 30 s pause
    // lets the post-game pipeline (WS → DB write, queue drain) quiesce
    // before we move on. Heavy but reliable; see e2e-tests/AGENTS.md.
    log(`[cm-escape-rate-display] Game ${gameIndex} ended — pausing 30 s to quiesce`);
    await reporterPage.waitForTimeout(30000);
}

/**
 * File an escaping report on the current game page, then have 3 CMs
 * vote the specified action to resolve it.
 */
async function reportAndVote(
    reporterPage: Page,
    cmPages: Page[],
    voteAction: string,
): Promise<void> {
    // Report the accused (white) for escaping
    await reportPlayerByColor(
        reporterPage,
        ".white",
        "escaping",
        "E2E test: player escaped this game",
    );

    const reportNumber = await captureReportNumber(reporterPage);

    // 3 CMs vote to reach consensus
    for (const cmPage of cmPages) {
        await navigateToReport(cmPage, reportNumber);
        await cmPage.locator(`input[value="${voteAction}"]`).click();
        const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
        await voteButton.click();
    }
}

/**
 * Dismiss any warning/ack dialogs that have accumulated on the accused's page.
 * Must be done before the accused can accept the next challenge.
 */
async function dismissWarningDialogs(page: Page): Promise<void> {
    // Dismiss formal warnings (require checking "I understand" checkbox)
    const formalWarning = page.locator("div.AccountWarning");
    for (let i = 0; i < 10; i++) {
        try {
            await formalWarning.waitFor({ state: "visible", timeout: 3000 });
            const checkbox = formalWarning.locator('input[type="checkbox"]');
            await checkbox.check();
            await formalWarning.locator("button.primary").click();
            await expect(formalWarning).not.toBeVisible();
        } catch {
            break;
        }
    }

    // Dismiss informal warnings
    const infoOk = page.locator(".AccountWarningInfo button.primary");
    for (let i = 0; i < 10; i++) {
        try {
            await infoOk.waitFor({ state: "visible", timeout: 3000 });
            await infoOk.click();
            await expect(infoOk).not.toBeVisible();
        } catch {
            break;
        }
    }

    // Dismiss ack dialogs (reporter gets these)
    const ackOk = page.locator("div.AccountWarningAck button.primary");
    for (let i = 0; i < 10; i++) {
        try {
            await ackOk.waitFor({ state: "visible", timeout: 3000 });
            await ackOk.click();
            await expect(ackOk).not.toBeVisible();
        } catch {
            break;
        }
    }
}

export const cmEscapeRateDisplayTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    // Tagged @Slow in cm.spec.ts: this test plays five sequential games and
    // resolves four reports with three CM votes each to build up the escape
    // history the display assertion checks. Each game also includes a 30 s
    // post-game pause so the dev stack can commit Game.ended before the
    // next escaping report (otherwise moderate.py:714-725 rejects it as
    // HTTP 400). The cumulative time is genuine setup, not flakiness —
    // see AGENTS.md for the rule.
    const TIMEOUT_MS = 720 * 1000;

    // Create fresh users
    const accusedUsername = newTestUsername("ERHAcc"); // cspell:disable-line
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    const reporterUsername = newTestUsername("ERHRep"); // cspell:disable-line
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        reporterUsername,
        "test",
    );

    await withReportCountTracking(
        reporterPage,
        testInfo,
        async (tracker) => {
            // Set up the 3 CM contexts once and reuse them across all votes
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

            // ========================================
            // Games 1-2: Play, report, 3 CMs vote informal_warn_escaper
            // Games 3-4: Play, report, 3 CMs vote warn_escaper (formal)
            //
            // The vote action switches at game 3 because the predictive filter
            // hides informal-warn options once predicted count >= 3. Games 1-2
            // each have 0 then 1 prior confirmed escape, so predicted (1, then
            // 2) stays under threshold and informal is offered. From game 3
            // onward there are >= 2 prior confirmed escapes, so the predicted
            // count reaches the 3% threshold and the filter switches the
            // available options to formal-warn only.
            // ========================================

            for (let i = 1; i <= 4; i++) {
                const voteAction = i <= 2 ? "informal_warn_escaper" : "warn_escaper";
                await playAndFinishGame(reporterPage, accusedPage, accusedUsername, i);
                await reportAndVote(reporterPage, cmPages, voteAction);

                // Navigate home to trigger warning dialogs, then dismiss them
                await accusedPage.goto("/");
                await dismissWarningDialogs(accusedPage);
                await dismissWarningDialogs(reporterPage);
            }

            // ========================================
            // Game 5: Play and file the report we'll test the display on
            // ========================================

            await playAndFinishGame(reporterPage, accusedPage, accusedUsername, 5);

            await reportPlayerByColor(
                reporterPage,
                ".white",
                "escaping",
                "E2E test: player escaped this game (report 5)",
            );

            await tracker.assertCountIncreasedBy(reporterPage, 1);

            const reportNumber = await captureReportNumber(reporterPage);

            // ========================================
            // Verify the escape rate display (reuse V1's existing context)
            // ========================================

            const cmPage = cmPages[0];
            await navigateToReport(cmPage, reportNumber);

            // Verify the escape rate section is visible
            const escapeRateInfo = cmPage.locator(".escape-rate-info");
            await expect(escapeRateInfo).toBeVisible({ timeout: 15000 });

            // Verify the predictive header is present
            const conditionalHeader = cmPage.locator(".escape-rate-conditional-header");
            await expect(conditionalHeader).toBeVisible();
            await expect(conditionalHeader).toContainText("IF this is escaping:");

            // Verify the badge shows "Escaping too much" (red)
            const badge = cmPage.locator(".escape-rate-badge.escaping-too-much");
            await expect(badge).toBeVisible();
            await expect(badge).toContainText("Escaping too much");

            // Verify rate detail shows the predicted count (4 prior + 1 current = 5)
            const detail = cmPage.locator(".escape-rate-detail");
            await expect(detail).toBeVisible();
            await expect(detail).toContainText("5 escapes in 5 games");

            // Verify formal warning status
            const warningStatus = cmPage.locator(".formal-warning-status");
            await expect(warningStatus).toBeVisible();
            await expect(warningStatus).toContainText("Previously formally warned");

            // Close all CM contexts
            for (const ctx of cmContexts) {
                await ctx.close();
            }

            // ========================================
            // Clean up: cancel the open report
            // ========================================

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
