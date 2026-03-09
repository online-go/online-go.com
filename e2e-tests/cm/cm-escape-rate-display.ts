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
 * escaping reports, using seeded data.
 *
 * Uses init_e2e data:
 * - E2E_CM_ERH_ACC : accused with high escape rate (4 escapes in 5 games)
 * - E2E_CM_ERH_REP : reporter who filed the seeded report
 * - E2E_CM_ERH_V1 : CM with escaping power who views the report
 * - 5 games, 4 with escape warnings (3 informal + 1 formal)
 * - 1 open escaping IncidentReport on game 5
 *
 * Expected display:
 * - "Escaping too much" badge (red) — 4 escapes in 100-game window > 3% threshold
 * - "4 escapes in 5 games"
 * - "Previously formally warned"
 *
 * Note: The escape rate uses a 12-month rolling window from the report's
 * creation date. If the seeded games are older than 12 months they will
 * fall outside the window and this test will fail. Fix by re-running
 * `ogs-manage init_e2e` to delete and recreate the reports (games are
 * reused but the fresh report date resets the window).
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, TestInfo } from "@playwright/test";

import {
    captureReportNumber,
    navigateToReport,
    setupSeededCM,
    setupSeededUser,
} from "@helpers/user-utils";

import { expect } from "@playwright/test";

import { withReportCountTracking } from "@helpers/report-utils";

export const cmEscapeRateDisplayTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const TIMEOUT_MS = 60 * 1000;

    const { userPage: reporterPage } = await setupSeededUser(createContext, "E2E_CM_ERH_REP");

    await withReportCountTracking(
        reporterPage,
        testInfo,
        async (_tracker) => {
            // Find the seeded report number via the reporter's "My Own Reports"
            const reportNumber = await captureReportNumber(reporterPage);

            // Log in as CM and navigate directly to the report
            const { seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
                createContext,
                "E2E_CM_ERH_V1",
            );
            await navigateToReport(cmPage, reportNumber);

            // Verify the escape rate section is visible
            const escapeRateInfo = cmPage.locator(".escape-rate-info");
            await expect(escapeRateInfo).toBeVisible({ timeout: 15000 });

            // Verify the badge shows "Escaping too much" (red)
            const badge = cmPage.locator(".escape-rate-badge.escaping-too-much");
            await expect(badge).toBeVisible();
            await expect(badge).toContainText("Escaping too much");

            // Verify rate detail shows correct numbers
            const detail = cmPage.locator(".escape-rate-detail");
            await expect(detail).toBeVisible();
            await expect(detail).toContainText("4 escapes in 5 games");

            // Verify formal warning status
            const warningStatus = cmPage.locator(".formal-warning-status");
            await expect(warningStatus).toBeVisible();
            await expect(warningStatus).toContainText("Previously formally warned");

            await cmContext.close();
        },
        TIMEOUT_MS,
    );
};
