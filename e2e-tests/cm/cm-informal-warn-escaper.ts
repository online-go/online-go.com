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
 * Tests that CMs can vote "informal warning" on escaping reports, and
 * that the vote resolves the report and sends an ack to the reporter.
 *
 * Uses init_e2e data:
 * - E2E_CM_IWE_V1, E2E_CM_IWE_V2, E2E_CM_IWE_V3 : CMs with escaping power
 *
 * Creates dynamically:
 * - accused user - created fresh each run
 * - reporter user - created fresh each run
 * - 1 game between reporter and accused
 *
 * Flow:
 * 1. Reporter plays a real 9x9 game with accused, then files an escaping report
 * 2. CM1 views report and verifies escape rate badge shows "Rate: tolerable"
 * 3. All 3 CMs vote informal_warn_escaper
 * 4. Reporter sees acknowledgement (AccountWarningAck)
 * 5. Accused sees informal warning (non-blocking AccountWarningInfo)
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

import { withReportCountTracking } from "@helpers/report-utils";

const CM_VOTERS = ["E2E_CM_IWE_V1", "E2E_CM_IWE_V2", "E2E_CM_IWE_V3"];

export const cmInformalWarnEscaperTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const TIMEOUT_MS = 120 * 1000;

    // Create fresh users — avoids accumulated warnings from previous runs
    const accusedUsername = newTestUsername("IWEAcc"); // cspell:disable-line
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    const reporterUsername = newTestUsername("IWERep"); // cspell:disable-line
    const { userPage: reporterPage } = await prepareNewUser(createContext, reporterUsername, "test");

    await withReportCountTracking(
        reporterPage,
        testInfo,
        async (tracker) => {
            // ========================================
            // Phase 0: Play a real game, then file escaping report
            // ========================================

            await createDirectChallenge(reporterPage, accusedUsername, {
                ...defaultChallengeSettings,
                gameName: "E2E CM IWE Report Game",
                boardSize: "9x9",
                speed: "blitz",
                color: "black",
            });

            await acceptDirectChallenge(accusedPage);

            const goban = reporterPage.locator(".Goban[data-pointers-bound]");
            await goban.waitFor({ state: "visible" });

            // Play a few moves (need >= 2 to pass the escaping report applicability check)
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

            // Report the accused (white) for escaping
            await reportPlayerByColor(
                reporterPage,
                ".white",
                "escaping",
                "E2E test: player escaped this game",
            );

            const reportNumber = await captureReportNumber(reporterPage);

            // ========================================
            // Phase 1: Set up CMs and verify escape rate display
            // ========================================

            const cmPages = [];
            const cmContexts = [];
            for (const cmUser of CM_VOTERS) {
                const { seededCMPage, seededCMContext } = await setupSeededCM(
                    createContext,
                    cmUser,
                );
                cmPages.push(seededCMPage);
                cmContexts.push(seededCMContext);
            }

            const cm1Page = cmPages[0];
            await navigateToReport(cm1Page, reportNumber);

            // Verify escape rate badge shows "Rate: tolerable" (rate-low class)
            const badge = cm1Page.locator(".escape-rate-badge");
            await expect(badge).toBeVisible({ timeout: 15000 });
            await expect(badge).toHaveClass(/rate-low/);

            // Verify formal warning status is visible
            const warningStatus = cm1Page.locator(".formal-warning-status");
            await expect(warningStatus).toBeVisible();

            const voteAction = "informal_warn_escaper";
            const voteOption = cm1Page.locator(`input[value="${voteAction}"]`);
            await expect(voteOption).toBeVisible();

            // ========================================
            // Phase 2: All 3 CMs vote
            // ========================================

            for (let i = 0; i < cmPages.length; i++) {
                const cmPage = cmPages[i];
                if (i > 0) {
                    await navigateToReport(cmPage, reportNumber);
                }
                await cmPage.locator(`input[value="${voteAction}"]`).click();
                const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
                await voteButton.click();
            }

            for (const ctx of cmContexts) {
                await ctx.close();
            }

            // ========================================
            // Phase 3: Reporter sees acknowledgement
            // ========================================

            await reporterPage.goto("/");
            await expect(reporterPage.locator("div.AccountWarningAck")).toBeVisible({
                timeout: 15000,
            });

            // Verify at least the first ack has a canned message
            await expect(
                reporterPage.locator("div.AccountWarningAck .canned-message"),
            ).toBeVisible();

            // Dismiss the ack
            const ackOkButton = reporterPage
                .locator("div.AccountWarningAck")
                .locator("button.primary");
            await ackOkButton.click();
            await expect(ackOkButton).not.toBeVisible({ timeout: 3000 });

            // ========================================
            // Phase 4: Verify the accused sees the right warning type
            // ========================================

            await accusedPage.goto("/");

            // Verify the accused sees an informal warning (INFO severity, non-blocking)
            await expect(accusedPage.locator(".AccountWarningInfo")).toBeVisible({
                timeout: 15000,
            });

            // Dismiss informal warning
            const infoOk = accusedPage.locator(".AccountWarningInfo button.primary");
            await infoOk.click();
            await expect(infoOk).not.toBeVisible();

            // Verify no BLOCKING warning dialog (formal/WARNING severity)
            await expect(accusedPage.locator("div.AccountWarning")).not.toBeVisible();

            await tracker.assertCountReturnedToInitial(reporterPage);
        },
        TIMEOUT_MS,
    );
};
