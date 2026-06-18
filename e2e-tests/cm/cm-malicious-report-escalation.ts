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

// cspell:words MRES MRESRep MRESVic

/*
 * Test 10 in the malicious-report design spec — escalation:
 *
 * Setup: a malicious_report exists.
 * 1. CM A (HANDLE_MALICIOUS_REPORT, no SUSPEND) sees four options:
 *    no_/informal_warn_/warn_/escalate. final_warning_/suspend_user are NOT
 *    visible.
 * 2. CM A votes escalate (unilateral escalation).
 * 3. Three SUSPEND CMs (HANDLE_MALICIOUS_REPORT + SUSPEND) see the escalated
 *    report. final_warning_malicious_reporter and suspend_user are now visible;
 *    escalate is gone.
 * 4. Three SUSPEND CMs vote final_warning_malicious_reporter → consensus →
 *    accused sees the final-warning AccountWarning, filer sees the matching
 *    AccountWarningAck.
 *
 * Uses init_e2e data:
 * - E2E_CM_MR_FILER (set up by setupMaliciousReport)
 * - E2E_CM_MR_CM_V1 : CM A — HANDLE_MALICIOUS_REPORT, no SUSPEND
 * - E2E_CM_MR_SUSPEND_V1, V2, V3 : CMs B — HANDLE_MALICIOUS_REPORT + SUSPEND
 */

import type { CreateContextOptions } from "@helpers";
import { BrowserContext, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

import { navigateToReport, setupSeededCM } from "@helpers/user-utils";
import { expectOGSClickableByName } from "@helpers/matchers";
import { withReportCountTracking } from "@helpers/report-utils";
import { setupMaliciousReport } from "@helpers/malicious-report-utils";

const SUSPEND_VOTERS = ["E2E_CM_MR_SUSPEND_V1", "E2E_CM_MR_SUSPEND_V2", "E2E_CM_MR_SUSPEND_V3"];

export const cmMaliciousReportEscalationTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const TIMEOUT_MS = 240 * 1000;

    const setup = await setupMaliciousReport(createContext, {
        sourceReporterRolePrefix: "MRESRep", // cspell:disable-line
        victimRolePrefix: "MRESVic", // cspell:disable-line
    });

    await withReportCountTracking(
        setup.sourceReporterPage,
        testInfo,
        async () => {
            // ========================================
            // Phase 1: CM A (no SUSPEND) sees the 4 unescalated options and escalates.
            // ========================================
            const { seededCMPage: cmAPage, seededCMContext: cmAContext } = await setupSeededCM(
                createContext,
                "E2E_CM_MR_CM_V1",
            );

            await navigateToReport(cmAPage, setup.maliciousReportNumber);

            // Verify available radio options pre-escalation
            await expect(cmAPage.locator('input[value="no_malicious_report"]')).toBeVisible();
            await expect(
                cmAPage.locator('input[value="informal_warn_malicious_reporter"]'),
            ).toBeVisible();
            await expect(cmAPage.locator('input[value="warn_malicious_reporter"]')).toBeVisible();
            await expect(cmAPage.locator('input[value="escalate"]')).toBeVisible();

            // SUSPEND-power actions are NOT visible to a CM without SUSPEND on
            // an unescalated report.
            await expect(
                cmAPage.locator('input[value="final_warning_malicious_reporter"]'),
            ).toHaveCount(0);
            await expect(cmAPage.locator('input[value="suspend_user"]')).toHaveCount(0);

            // CM A votes escalate (unilateral - one vote triggers escalation)
            await cmAPage.locator('input[value="escalate"]').click();
            await expect(cmAPage.locator('input[value="escalate"]')).toBeChecked();

            // Escalation requires a note
            const escalationNote = cmAPage.locator("#escalation-note");
            await expect(escalationNote).toBeVisible();
            await escalationNote.fill("E2E test: escalating malicious_report for review");
            await expect(escalationNote).toHaveValue(
                "E2E test: escalating malicious_report for review",
            );

            const cmAVoteButton = await expectOGSClickableByName(cmAPage, /Vote$/);
            await cmAVoteButton.click();

            await cmAContext.close();

            // ========================================
            // Phase 2: First SUSPEND CM verifies the escalated option set.
            // ========================================
            const { seededCMPage: firstSuspendPage, seededCMContext: firstSuspendContext } =
                await setupSeededCM(createContext, SUSPEND_VOTERS[0]);

            await navigateToReport(firstSuspendPage, setup.maliciousReportNumber);

            // Confirm the report has been escalated
            await expect(
                firstSuspendPage.getByText(/Escalated due to VotingOutcome.VOTED_ESCALATION/),
            ).toBeVisible({ timeout: 15000 });

            // Post-escalation options: no/informal/warn remain, final_warning
            // and suspend_user are now exposed, escalate is gone.
            await expect(
                firstSuspendPage.locator('input[value="no_malicious_report"]'),
            ).toBeVisible();
            await expect(
                firstSuspendPage.locator('input[value="informal_warn_malicious_reporter"]'),
            ).toBeVisible();
            await expect(
                firstSuspendPage.locator('input[value="warn_malicious_reporter"]'),
            ).toBeVisible();
            await expect(
                firstSuspendPage.locator('input[value="final_warning_malicious_reporter"]'),
            ).toBeVisible();
            await expect(firstSuspendPage.locator('input[value="suspend_user"]')).toBeVisible();
            await expect(firstSuspendPage.locator('input[value="escalate"]')).toHaveCount(0);

            // First SUSPEND CM votes final_warning_malicious_reporter
            await firstSuspendPage
                .locator('input[value="final_warning_malicious_reporter"]')
                .click();
            await expect(
                firstSuspendPage.locator('input[value="final_warning_malicious_reporter"]'),
            ).toBeChecked();
            const firstSuspendVoteButton = await expectOGSClickableByName(
                firstSuspendPage,
                /Vote$/,
            );
            await firstSuspendVoteButton.click();

            await firstSuspendContext.close();

            // ========================================
            // Phase 3: Two more SUSPEND CMs vote to reach consensus (3 total)
            // ========================================
            for (const cmUser of SUSPEND_VOTERS.slice(1)) {
                const { seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
                    createContext,
                    cmUser,
                );

                await navigateToReport(cmPage, setup.maliciousReportNumber);

                const radio = cmPage.locator('input[value="final_warning_malicious_reporter"]');
                await expect(radio).toBeVisible();
                await radio.click();
                await expect(radio).toBeChecked();

                const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
                await voteButton.click();

                await cmContext.close();
            }

            // ========================================
            // Phase 4: Verify accused sees the final-warning AccountWarning,
            // filer sees the ack_final_warn_malicious_reporter ack.
            // ========================================
            await setup.sourceReporterPage.goto("/");
            const warning = setup.sourceReporterPage.locator("div.AccountWarning");
            await expect(warning).toBeVisible({ timeout: 15000 });
            await expect(
                warning.locator("div.canned-message.final_warn_malicious_reporter"),
            ).toBeVisible();
            await expect(warning.locator("div.canned-message")).not.toBeEmpty();

            await setup.filerPage.goto("/");
            const ack = setup.filerPage.locator("div.AccountWarningAck");
            await expect(ack).toBeVisible({ timeout: 15000 });
            await expect(
                ack.locator("div.canned-message.ack_final_warn_malicious_reporter"),
            ).toBeVisible();
            await expect(ack.locator("div.canned-message")).not.toBeEmpty();

            await setup.filerContext.close();
        },
        TIMEOUT_MS,
    );
};
