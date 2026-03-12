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
 * - E2E_CM_IWE_ACC : accused with low escape rate
 * - E2E_CM_IWE_OTH : opponent in the seeded games (for escape rate history)
 * - E2E_CM_IWE_V1, E2E_CM_IWE_V2, E2E_CM_IWE_V3 : CMs with escaping power
 * Reporter is created fresh each run via prepareNewUser to avoid "too many
 * outstanding reports" from leftover reports of previous failed runs.
 * - 3 seeded games between ACC and OTH (for escape rate history)
 * - 1 prior informal warning on game 1
 *
 * Flow:
 * 1. Reporter plays a real 9x9 game with ACC, then files an escaping report
 * 2. CM1 views report and verifies escape rate badge shows "Rate: tolerable"
 *    (fails if rate is too high — reseed with `ogs-manage init_e2e`)
 * 3. All 3 CMs vote informal_warn_escaper
 * 4. Reporter sees acknowledgement (AccountWarningAck)
 * 5. Accused sees informal warning (non-blocking AccountWarningInfo)
 *
 * Note: The escape rate uses a 12-month rolling window from the report's
 * creation date. If the seeded games are older than 12 months they will
 * fall outside the window and this test will fail. Fix by re-running
 * `ogs-manage init_e2e` to delete and recreate the games.
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, TestInfo } from "@playwright/test";

import {
    captureReportNumber,
    generateUniqueTestIPv6,
    loginAsUser,
    navigateToReport,
    newTestUsername,
    prepareNewUser,
    reportPlayerByColor,
    setupSeededCM,
    turnOffDynamicHelp,
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

export const cmInformalWarnEscaperTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const TIMEOUT_MS = 120 * 1000;

    // Use a fresh reporter each run to avoid "Too many outstanding reports"
    // from leftover reports of previous failed runs.
    const reporterUsername = newTestUsername("IWE_REP");
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
            // Phase 0: Play a real game, then file escaping report via the UI
            // ========================================

            // Set up accused page manually — setupSeededUser would hang because
            // warning dialogs block turnOffDynamicHelp.
            // We log in, dismiss all warnings, then turn off dynamic help.
            const accusedContext = await createContext({
                extraHTTPHeaders: { "X-Forwarded-For": generateUniqueTestIPv6() },
            });
            const accusedGamePage = await accusedContext.newPage();
            await loginAsUser(accusedGamePage, "E2E_CM_IWE_ACC", "test");
            await accusedGamePage.goto("/");

            // Dismiss any formal warning dialogs (from previous runs that voted
            // warn_escaper). These require checking "I understand" before OK.
            const formalWarning = accusedGamePage.locator("div.AccountWarning");
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

            // Dismiss any informal warning dialogs (from seeded prior warning and/or
            // previous test runs). May not appear if already acknowledged.
            const warningOk = accusedGamePage.locator(".AccountWarningInfo button.primary");
            for (let i = 0; i < 10; i++) {
                try {
                    await warningOk.waitFor({ state: "visible", timeout: 3000 });
                    await warningOk.click();
                    await expect(warningOk).not.toBeVisible();
                } catch {
                    break; // No more warning dialogs
                }
            }

            await turnOffDynamicHelp(accusedGamePage);

            // Decline any stale challenges from previous failed runs
            const declineButton = accusedGamePage.locator(".fab.reject.raiser");
            for (let i = 0; i < 10; i++) {
                try {
                    await declineButton.first().waitFor({ state: "visible", timeout: 2000 });
                    await declineButton.first().click();
                } catch {
                    break;
                }
            }

            // Reporter (black) challenges accused (white) to a quick 9x9 game
            await createDirectChallenge(reporterPage, "E2E_CM_IWE_ACC", {
                ...defaultChallengeSettings,
                gameName: "E2E CM IWE Report Game",
                boardSize: "9x9",
                speed: "blitz",
                color: "black",
            });

            await acceptDirectChallenge(accusedGamePage);

            // Wait for goban to be ready
            const goban = reporterPage.locator(".Goban[data-pointers-bound]");
            await goban.waitFor({ state: "visible" });

            // Play a few moves (need >= 2 to pass the escaping report applicability check)
            await playMoves(reporterPage, accusedGamePage, ["D5", "E5", "D6", "E6"], "9x9");

            // End the game: both pass, both accept scoring
            await reporterPage.getByText("Pass", { exact: true }).click();
            await accusedGamePage.getByText("Pass", { exact: true }).click();

            const accusedAccept = accusedGamePage.getByText("Accept");
            await expect(accusedAccept).toBeVisible();
            await accusedAccept.click();

            const reporterAccept = reporterPage.getByText("Accept");
            await expect(reporterAccept).toBeVisible();
            await reporterAccept.click();

            await expect(reporterPage.getByText("wins by")).toBeVisible();

            // Report the accused (white) for escaping from the game page
            await reportPlayerByColor(
                reporterPage,
                ".white",
                "escaping",
                "E2E test: player escaped this game",
            );

            // Find the report number via reporter's "My Own Reports"
            const reportNumber = await captureReportNumber(reporterPage);

            // ========================================
            // Phase 1: CM1 verifies escape rate display and informal warning option
            // ========================================

            const { seededCMPage: cm1Page, seededCMContext: cm1Context } = await setupSeededCM(
                createContext,
                "E2E_CM_IWE_V1",
            );
            await navigateToReport(cm1Page, reportNumber);

            // Verify escape rate badge shows "Rate: tolerable" (rate-low class).
            // If it shows "Escaping too much" the seeded data needs resetting
            // via `ogs-manage init_e2e`.
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

            const cmVoters = ["E2E_CM_IWE_V1", "E2E_CM_IWE_V2", "E2E_CM_IWE_V3"];
            for (const cmUser of cmVoters) {
                let cmPage;
                let cmContext;
                if (cmUser === "E2E_CM_IWE_V1") {
                    cmPage = cm1Page;
                    cmContext = cm1Context;
                } else {
                    ({ seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
                        createContext,
                        cmUser,
                    ));
                    await navigateToReport(cmPage, reportNumber);
                }

                await cmPage.locator(`input[value="${voteAction}"]`).click();
                const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
                await voteButton.click();
                await cmContext.close();
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

            // Dismiss all pending acks (there may be extras from previous runs)
            const ackOkButton = reporterPage
                .locator("div.AccountWarningAck")
                .locator("button.primary");
            for (let i = 0; i < 10; i++) {
                try {
                    await ackOkButton.waitFor({ state: "visible", timeout: 3000 });
                    await ackOkButton.click();
                    await expect(ackOkButton).not.toBeVisible({ timeout: 3000 });
                } catch {
                    break; // No more ack dialogs
                }
            }

            // ========================================
            // Phase 4: Verify the accused sees the right warning type
            // ========================================

            // Use manual login (not setupSeededUser) because the accused may have
            // warning dialogs that block turnOffDynamicHelp inside setupSeededUser.
            const accusedCheckContext = await createContext({
                extraHTTPHeaders: { "X-Forwarded-For": generateUniqueTestIPv6() },
            });
            const accusedPage = await accusedCheckContext.newPage();
            await loginAsUser(accusedPage, "E2E_CM_IWE_ACC", "test");
            await accusedPage.goto("/");

            // Verify the accused sees an informal warning (INFO severity, non-blocking)
            await expect(accusedPage.locator(".AccountWarningInfo")).toBeVisible({
                timeout: 15000,
            });

            // Dismiss informal warning dialogs (may have extras from previous runs)
            const infoOk = accusedPage.locator(".AccountWarningInfo button.primary");
            for (let i = 0; i < 10; i++) {
                try {
                    await infoOk.waitFor({ state: "visible", timeout: 3000 });
                    await infoOk.click();
                    await expect(infoOk).not.toBeVisible();
                } catch {
                    break;
                }
            }

            // Verify no BLOCKING warning dialog (formal/WARNING severity)
            await expect(accusedPage.locator("div.AccountWarning")).not.toBeVisible();

            await tracker.assertCountReturnedToInitial(reporterPage);
        },
        TIMEOUT_MS,
    );
};
