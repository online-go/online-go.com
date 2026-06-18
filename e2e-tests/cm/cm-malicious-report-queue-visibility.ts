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
 *  9. The ReportTypeSelector dropdown exposes "Malicious Report" for a CM with
 *     HANDLE_MALICIOUS_REPORT and not for one without it. The same
 *     community_mod_has_power gate also drives the category sidebar in
 *     /reports-center, so the negative case is covered by the sidebar
 *     visibility check in Test 8.
 *
 * Uses init_e2e data:
 * - E2E_CM_MR_FILER (set up by setupMaliciousReport, has HANDLE_ESCAPING too)
 * - E2E_CM_MR_NO_POWER : CM with HANDLE_STALLING (negative case for Test 8)
 */

import type { CreateContextOptions } from "@helpers";
import { BrowserContext, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

import { navigateToReport, setupSeededCM } from "@helpers/user-utils";
import { withReportCountTracking } from "@helpers/report-utils";
import { setupMaliciousReport } from "@helpers/malicious-report-utils";

export const cmMaliciousReportQueueVisibilityTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const TIMEOUT_MS = 180 * 1000;

    const setup = await setupMaliciousReport(createContext, {
        sourceReporterRolePrefix: "MRQVRep", // cspell:disable-line
        victimRolePrefix: "MRQVVic", // cspell:disable-line
    });

    await withReportCountTracking(
        setup.sourceReporterPage,
        testInfo,
        async () => {
            // ========================================
            // Test 9 (positive): filer (HANDLE_MALICIOUS_REPORT + HANDLE_ESCAPING)
            // views the source escaping report and the type-selector dropdown
            // includes "Malicious Report" as an option.
            // ========================================
            await navigateToReport(setup.filerPage, setup.sourceReportNumber);

            const typeSelector = setup.filerPage.locator(".report-type-selector");
            await expect(typeSelector).toBeVisible();
            // Source report's current type is "Stopped Playing", so "Malicious
            // Report" only appears once the dropdown is opened.
            await typeSelector.click();
            await expect(
                setup.filerPage
                    .locator(".ogs-react-select__menu")
                    .getByText("Malicious Report", { exact: true }),
            ).toBeVisible({ timeout: 5000 });

            // ========================================
            // Test 8: NO_POWER CM (HANDLE_STALLING only) cannot see the MR
            // ========================================
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
            await setup.filerContext.close();
        },
        TIMEOUT_MS,
    );
};
