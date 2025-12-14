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

// cspell:words VOOR REPOR

/*
 * Uses init_e2e data:
 * - E2E_CM_VOOR_REPORTER : user who reports
 * - E2E_CM_VOOR_REPORTED : user who is reported
 * - "E2E CM VOOR Sample Game" : game in which the report is made
 * - E2E_CM_OTHER_VOOR : The other person in that game (who's name must not match E2E_CM_VOOR_! See below!)
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, TestInfo, expect } from "@playwright/test";

import { expectOGSClickableByName } from "@helpers/matchers";
import {
    captureReportNumber,
    goToUsersFinishedGame,
    navigateToReport,
    reportUser,
    setupSeededUser,
} from "@helpers/user-utils";

import { withReportCountTracking } from "@helpers/report-utils";

export const cmVoteOnOwnReportTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const { userPage: reporterPage } = await setupSeededUser(createContext, "E2E_CM_VOOR_REPORTER");

    await withReportCountTracking(reporterPage, testInfo, async (tracker) => {
        await goToUsersFinishedGame(reporterPage, "E2E_CM_VOOR_REPORTED", "E2E CM VOOR Game");

        // ... and report the user
        // (The username is truncated inside the player card!  So the "other player" name must not match here!)
        await reportUser(
            reporterPage,
            "E2E_CM_VOOR_",
            "score_cheating",
            "E2E test reporting a score cheat",
        );

        // Verify reporter's count increased by 1
        await tracker.assertCountIncreasedBy(reporterPage, 1);

        // Capture the report number to navigate to the specific report
        const reportNumber = await captureReportNumber(reporterPage);

        // Navigate to the specific report
        await navigateToReport(reporterPage, reportNumber);

        // Select an option...
        const radioButton = reporterPage.locator('.action-selector input[type="radio"]').first();
        await radioButton.click();
        await expect(radioButton).toBeChecked();

        // ... then we should be allowed to vote.

        await expectOGSClickableByName(reporterPage, /Vote$/);

        // .. but instead, let's cancel this report, to tidy up.
        // Navigate to My Own Reports
        await reporterPage.goto("/reports-center");
        const myReports = reporterPage.getByText("My Own Reports");
        await expect(myReports).toBeVisible();
        await myReports.click();

        // Find the specific report's container and click its Cancel button
        // Each report is in a div.incident container
        // Use regex with negative lookahead to match exact report number (e.g., R1 but not R14)
        // This ensures the report number isn't followed by another digit
        const reportContainer = reporterPage
            .locator("div.incident")
            .filter({ hasText: new RegExp(`${reportNumber}(?!\\d)`) });
        await expect(reportContainer).toBeVisible();

        // Find the Cancel button within this specific report's container
        const cancelButton = reportContainer.locator("button.reject.xs", { hasText: "Cancel" });
        await expect(cancelButton).toBeVisible();
        await cancelButton.click();

        // After canceling the report, the count should return to initial
        await tracker.assertCountReturnedToInitial(reporterPage);
    });
};
