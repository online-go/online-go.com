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

import { Browser, TestInfo, expect } from "@playwright/test";

import { expectOGSClickableByName } from "@helpers/matchers";
import { goToUsersGame, reportUser, setupSeededUser } from "@helpers/user-utils";

import { withIncidentIndicatorLock } from "@helpers/report-utils";

export const cmVoteOnOwnReportTest = async (
    { browser }: { browser: Browser },
    testInfo: TestInfo,
) => {
    await withIncidentIndicatorLock(testInfo, async () => {
        const { userPage: reporterPage } = await setupSeededUser(browser, "E2E_CM_VOOR_REPORTER");

        await goToUsersGame(reporterPage, "E2E_CM_VOOR_REPORTED", "E2E CM VOOR Game");

        // ... and report the user
        // (The username is truncated inside the player card!  So the "other player" name must not match here!)
        await reportUser(
            reporterPage,
            "E2E_CM_VOOR_",
            "score_cheating",
            "E2E test reporting a score cheat",
        );

        // Go to the report page
        await reporterPage.goto("/reports-center");
        const myReports = reporterPage.getByText("My Own Reports");
        await expect(myReports).toBeVisible();
        await myReports.click();

        // We assume that the report is the first one in the list
        const reportButton = reporterPage.locator(".report-id > button");
        await reportButton.click();

        // Select an option...
        await reporterPage.locator('.action-selector input[type="radio"]').first().click();

        // ... then we should be allowed to vote.

        await expectOGSClickableByName(reporterPage, /Vote$/);

        // .. but instead, let's cancel this report, to tidy up.

        await myReports.click();
        const cancelButton = await expectOGSClickableByName(reporterPage, /Cancel$/);
        await cancelButton.click();

        await expect(reportButton).toBeHidden();
    });
};
