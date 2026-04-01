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
 * Tests that CMs see escaping reports one at a time per reported user.
 * When multiple escaping reports exist against the same user, only the oldest
 * is presented. After resolving it, the next one becomes visible.
 *
 * Uses init_e2e data:
 * - E2E_CM_EQD_V1, E2E_CM_EQD_V2, E2E_CM_EQD_V3 : CMs with escaping power
 *
 * Creates dynamically:
 * - accused user - the player reported for escaping (twice)
 * - reporter user - files both reports
 * - 2 games between reporter and accused
 *
 * Flow:
 * 1. Reporter plays two games with accused, both end
 * 2. Reporter files escaping reports on both games
 * 3. CM1 navigates to reports center — only sees one escaping report
 * 4. All 3 CMs vote to resolve the first report
 * 5. CM1 now sees the second report
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, TestInfo } from "@playwright/test";

import {
    captureReportNumber,
    navigateToReport,
    newTestUsername,
    prepareNewUser,
    reportPlayerByColor,
    setupSeededCM,
} from "@helpers/user-utils";

import {
    createDirectChallenge,
    acceptDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";
import { expect } from "@playwright/test";
import { log } from "@helpers/logger";

import { withReportCountTracking } from "@helpers/report-utils";

const CM_VOTERS = ["E2E_CM_EQD_V1", "E2E_CM_EQD_V2", "E2E_CM_EQD_V3"];

// cspell:words EQDAcc EQDRep
export const cmEscapingOneAtATimeTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const TIMEOUT_MS = 180 * 1000;
    log("=== Escaping One At A Time Test ===");

    // Create fresh users
    const accusedUsername = newTestUsername("EQDAcc");
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    const reporterUsername = newTestUsername("EQDRep");
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        reporterUsername,
        "test",
    );

    await withReportCountTracking(
        reporterPage,
        testInfo,
        async (tracker) => {
            // ========================================
            // Phase 0a: Set up CM1 early to capture baseline report count
            // ========================================

            log("Setting up CM1 to capture baseline count...");
            const { seededCMPage: cm1Page, seededCMContext: cm1Context } = await setupSeededCM(
                createContext,
                CM_VOTERS[0],
            );

            // Wait for any existing reports to load via websocket
            await cm1Page.waitForTimeout(2000);
            const cmIndicator = cm1Page.locator(".IncidentReportIndicator");
            const cmCountEl = cmIndicator.locator(".count");
            const baselineText = await cmCountEl.textContent();
            const baselineCount = parseInt(baselineText || "0", 10);
            log(`CM1 baseline report count: ${baselineCount}`);

            // ========================================
            // Phase 0b: Play two games, file two escaping reports
            // ========================================

            // Game 1
            log("Playing game 1...");
            await createDirectChallenge(reporterPage, accusedUsername, {
                ...defaultChallengeSettings,
                gameName: "E2E EQD Game 1",
                boardSize: "9x9",
                speed: "blitz",
                color: "black",
            });
            await acceptDirectChallenge(accusedPage);

            const goban1 = reporterPage.locator(".Goban[data-pointers-bound]");
            await goban1.waitFor({ state: "visible" });
            await playMoves(reporterPage, accusedPage, ["D5", "E5", "D6", "E6"], "9x9");

            // End game 1: both pass, both accept
            await reporterPage.getByText("Pass", { exact: true }).click();
            await accusedPage.getByText("Pass", { exact: true }).click();
            await expect(accusedPage.getByText("Accept")).toBeVisible();
            await accusedPage.getByText("Accept").click();
            await expect(reporterPage.getByText("Accept")).toBeVisible();
            await reporterPage.getByText("Accept").click();
            await expect(reporterPage.getByText("wins by")).toBeVisible();
            log("Game 1 complete");

            // Report accused for escaping in game 1
            await reportPlayerByColor(
                reporterPage,
                ".white",
                "escaping",
                "E2E dedup test: escaping report 1",
            );
            const reportNumber1 = await captureReportNumber(reporterPage);
            log(`Report 1 filed: ${reportNumber1}`);

            // Game 2
            log("Playing game 2...");
            await createDirectChallenge(reporterPage, accusedUsername, {
                ...defaultChallengeSettings,
                gameName: "E2E EQD Game 2",
                boardSize: "9x9",
                speed: "blitz",
                color: "black",
            });
            await acceptDirectChallenge(accusedPage);

            const goban2 = reporterPage.locator(".Goban[data-pointers-bound]");
            await goban2.waitFor({ state: "visible" });
            await playMoves(reporterPage, accusedPage, ["D5", "E5", "D6", "E6"], "9x9");

            // End game 2
            await reporterPage.getByText("Pass", { exact: true }).click();
            await accusedPage.getByText("Pass", { exact: true }).click();
            await expect(accusedPage.getByText("Accept")).toBeVisible();
            await accusedPage.getByText("Accept").click();
            await expect(reporterPage.getByText("Accept")).toBeVisible();
            await reporterPage.getByText("Accept").click();
            await expect(reporterPage.getByText("wins by")).toBeVisible();
            log("Game 2 complete");

            // Report accused for escaping in game 2
            await reportPlayerByColor(
                reporterPage,
                ".white",
                "escaping",
                "E2E dedup test: escaping report 2",
            );
            const reportNumber2 = await captureReportNumber(reporterPage);
            log(`Report 2 filed: ${reportNumber2}`);

            // ========================================
            // Phase 1: CM1 should only see one of the two reports in their queue
            // ========================================

            // Two reports were filed against the same user, but with dedup the
            // CM's queue count should only increase by 1, not 2.
            const expectedAfterFiling = baselineCount + 1;
            const cmActiveCount = cmIndicator.locator(".count.active");
            await expect(cmActiveCount).toHaveText(`${expectedAfterFiling}`, { timeout: 15000 });
            log(
                `CM1 queue count is ${expectedAfterFiling} (baseline ${baselineCount} + 1, not +2)`,
            );

            await cm1Context.close();

            // ========================================
            // Phase 2: Resolve the first report with 3 CM votes
            // ========================================

            log("Resolving report 1 with 3 CM votes...");
            const voteAction = "no_escaping";

            for (let i = 0; i < CM_VOTERS.length; i++) {
                const { seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
                    createContext,
                    CM_VOTERS[i],
                );
                await navigateToReport(cmPage, reportNumber1);
                await cmPage.locator(`input[value="${voteAction}"]`).click();
                const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
                await voteButton.click();
                await cmContext.close();
            }
            log("Report 1 resolved");

            // Dismiss the reporter's acknowledgement so it doesn't interfere
            await reporterPage.goto("/");
            const ackDialog = reporterPage.locator("div.AccountWarningAck");
            if (await ackDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
                const ackOk = ackDialog.locator("button.primary");
                await ackOk.click();
                await expect(ackOk).not.toBeVisible({ timeout: 3000 });
            }

            // ========================================
            // Phase 3: CM1 should now see the second report
            // ========================================

            log("Verifying CM1 can now see report 2...");
            const { seededCMPage: cm1PageAgain, seededCMContext: cm1ContextAgain } =
                await setupSeededCM(createContext, CM_VOTERS[0]);

            // Navigate to report 2 — voting options should now be available
            // because report 1 was resolved and the dedup no longer blocks it
            await navigateToReport(cm1PageAgain, reportNumber2);
            await expect(cm1PageAgain.locator("#ViewReport")).toBeVisible({ timeout: 15000 });
            const voteOption2 = cm1PageAgain.locator('input[value="no_escaping"]');
            await expect(voteOption2).toBeVisible({ timeout: 15000 });
            log("CM1 can now vote on report 2");

            await cm1ContextAgain.close();

            // Resolve report 2 to clean up
            log("Resolving report 2...");
            for (let i = 0; i < CM_VOTERS.length; i++) {
                const { seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
                    createContext,
                    CM_VOTERS[i],
                );
                await navigateToReport(cmPage, reportNumber2);
                await cmPage.locator(`input[value="${voteAction}"]`).click();
                const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
                await voteButton.click();
                await cmContext.close();
            }
            log("Report 2 resolved");

            // Dismiss any remaining acks
            await reporterPage.goto("/");
            const ackDialog2 = reporterPage.locator("div.AccountWarningAck");
            if (await ackDialog2.isVisible({ timeout: 5000 }).catch(() => false)) {
                const ackOk2 = ackDialog2.locator("button.primary");
                await ackOk2.click();
                await expect(ackOk2).not.toBeVisible({ timeout: 3000 });
            }

            await tracker.assertCountReturnedToInitial(reporterPage);
        },
        TIMEOUT_MS,
    );

    log("=== Escaping Queue Dedup Test Complete ===");
};
