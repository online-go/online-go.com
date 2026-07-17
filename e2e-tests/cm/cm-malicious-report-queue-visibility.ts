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

// cspell:words MRQV MRQVRep MRQVVic

/*
 * Tests 8 and 9 in the malicious-report design spec:
 *
 *  8. A CM without HANDLE_MALICIOUS_REPORT does not see the malicious_report
 *     in /reports-center (validates termination-server dispatch), and
 *     navigating directly to the report URL does not show vote options
 *     (validates the user_can_moderate gate).
 *  9. The ReportTypeSelector dropdown never offers "Malicious Report" as a
 *     retype target — a malicious_report is filed through the PlayerDetails
 *     -> Report dialog, not by retyping an existing report. The category
 *     sidebar in /reports-center is still power-gated (a CM without
 *     HANDLE_MALICIOUS_REPORT does not see the "Malicious report" category),
 *     which Test 8 covers.
 *
 * Uses init_e2e data:
 * - E2E_CM_MR_FILER (set up by setupMaliciousReport; also has
 *   HANDLE_SCORE_CHEAT to view the score-cheating source, and HANDLE_ESCAPING)
 * - E2E_CM_MR_NO_POWER : CM with HANDLE_STALLING (negative case for Test 8)
 */

import type { CreateContextOptions } from "@helpers";
import { BrowserContext, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

import { navigateToReport, setupSeededCM } from "@helpers/user-utils";
import { log } from "@helpers/logger";
import { withReportCountTracking } from "@helpers/report-utils";
import { cancelOwnReport, setupMaliciousReport } from "@helpers/malicious-report-utils";

export const cmMaliciousReportQueueVisibilityTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const TIMEOUT_MS = 300 * 1000;
    // setupMaliciousReport runs before withReportCountTracking; set early.
    testInfo.setTimeout(TIMEOUT_MS);

    const setup = await setupMaliciousReport(createContext, {
        sourceReporterRolePrefix: "MRQVRep", // cspell:disable-line
        victimRolePrefix: "MRQVVic", // cspell:disable-line
    });

    await withReportCountTracking(
        setup.sourceReporterPage,
        testInfo,
        async () => {
            // ========================================
            // Test 9 (type-selector filter): "Malicious Report" is NOT offered
            // as a retype target, even for the filer who holds
            // HANDLE_MALICIOUS_REPORT. A malicious_report is filed through the
            // PlayerDetails -> Report dialog (see cmFileMaliciousReportTest),
            // never by retyping an existing report.
            // ========================================
            log(`[MR/queue] Test 9: "Malicious Report" is not a retype option`);
            await navigateToReport(setup.filerPage, setup.sourceReportNumber);

            const typeSelector = setup.filerPage.locator(".report-type-selector");
            await expect(typeSelector).toBeVisible();
            // Open the retype dropdown: it lists other report types (e.g.
            // "Stopped Playing") but must not offer "Malicious Report".
            await typeSelector.click();
            const typeMenu = setup.filerPage.locator(".ogs-react-select__menu");
            await expect(typeMenu.getByText("Stopped Playing", { exact: true })).toBeVisible({
                timeout: 5000,
            });
            await expect(typeMenu.getByText("Malicious Report", { exact: true })).toHaveCount(0);

            // ========================================
            // Test 8: NO_POWER CM (HANDLE_STALLING only) cannot see the MR
            // ========================================
            log(`[MR/queue] Test 8: NO_POWER CM cannot see MR in queue or via direct URL`);
            const { seededCMPage: noPowerPage, seededCMContext: noPowerContext } =
                await setupSeededCM(createContext, "E2E_CM_MR_NO_POWER");

            await noPowerPage.goto("/reports-center");
            await expect(noPowerPage.locator("#ReportsCenterCategoryList")).toBeVisible();

            // Category sidebar should not list "Malicious report" (this is also
            // Test 9 negative — the sidebar uses the same community_mod_has_power
            // gate as the ReportTypeSelector).
            await expect(
                noPowerPage.locator("#ReportsCenterCategoryList").getByText("Malicious report"),
            ).toHaveCount(0);

            // The specific MR is not visible anywhere in their queue.
            const mrId = setup.maliciousReportNumber.replace(/^R/, "");
            await expect(noPowerPage.locator(`button[data-report-id="${mrId}"]`)).toHaveCount(0);

            // Navigating directly to the report URL exposes no vote options.
            // The backend gate (user_can_moderate) returns 403 so the report
            // never loads and no vote radios render.
            await noPowerPage.goto(`/reports-center/all/${mrId}`);
            await noPowerPage.waitForTimeout(2000);
            await expect(noPowerPage.locator(".action-selector input[type='radio']")).toHaveCount(
                0,
            );
            await expect(noPowerPage.locator('input[value="warn_malicious_reporter"]')).toHaveCount(
                0,
            );

            await noPowerContext.close();

            // Cleanup: the malicious_report doesn't get resolved in this
            // test, so cancel it so the seeded CM filer doesn't accumulate
            // pending reports. Source escaping report is owned by an
            // ephemeral fresh user.
            await cancelOwnReport(setup.filerPage, setup.maliciousReportNumber);

            await setup.filerContext.close();
        },
        TIMEOUT_MS,
    );
};
