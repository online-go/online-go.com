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

// cspell:words SOPEV

/*
 * Uses init_e2e data:
 * - E2E_CM_SOPEV_REPORTED : user who is reported
 * - "E2E CM SOPEV Game" : game in which the report is made
 * - E2E_CM_SOPEV_OTHER : The other person in that game
 * - E2E_CM_SOPEV_INITIAL_VOTER : CM who places initial vote
 * - E2E_CM_SOPEV_ESCALATOR : CM who escalates the report
 */

import { Browser, TestInfo } from "@playwright/test";

import {
    assertIncidentReportIndicatorActive,
    goToUsersGame,
    newTestUsername,
    prepareNewUser,
    reportUser,
    setupSeededCM,
} from "@helpers/user-utils";

import { expectOGSClickableByName } from "@helpers/matchers";
import { expect } from "@playwright/test";
import { withIncidentIndicatorLock } from "@helpers/report-utils";

export const cmShowOnlyPostEscalationVotesTest = async (
    { browser }: { browser: Browser },
    testInfo: TestInfo,
) => {
    await withIncidentIndicatorLock(testInfo, async () => {
        const { userPage: reporterPage } = await prepareNewUser(
            browser,
            newTestUsername("CmSOPEVRep"), // cspell:disable-line
            "test",
        );

        // Report someone for escaping
        await goToUsersGame(reporterPage, "E2E_CM_SOPEV_REPORTED", "E2E CM SOPEV Game");

        await reportUser(
            reporterPage,
            "E2E_CM_SOPEV_OTHER",
            "score_cheating",
            "E2E test - SOPEV reporting score cheating!",
        );

        // Now put a pre-escalation vote on the report

        const { seededCMPage: initialVoterPage } = await setupSeededCM(
            browser,
            "E2E_CM_SOPEV_INITIAL_VOTER",
        );

        let indicator = await assertIncidentReportIndicatorActive(initialVoterPage, 1);

        await indicator.click();

        await expect(
            initialVoterPage.getByRole("heading", { name: "Reports Center" }),
        ).toBeVisible();

        await expect(
            initialVoterPage.getByText("E2E test - SOPEV reporting score cheating!"),
        ).toBeVisible();

        // Doesn't matter what option we vote for actually, first is handy
        await initialVoterPage.locator('.action-selector input[type="radio"]').first().click();
        let voteButton = await expectOGSClickableByName(initialVoterPage, /Vote$/);

        await voteButton.click();

        // Now escalate the report
        const { seededCMPage: escalatorPage } = await setupSeededCM(
            browser,
            "E2E_CM_SOPEV_ESCALATOR",
        );

        indicator = await assertIncidentReportIndicatorActive(escalatorPage, 1);

        await indicator.click();

        await expect(escalatorPage.getByRole("heading", { name: "Reports Center" })).toBeVisible();

        await expect(
            escalatorPage.getByText("E2E test - SOPEV reporting score cheating!"),
        ).toBeVisible();

        // escalation is always the last option - yay that's handy
        await escalatorPage.locator('.action-selector input[type="radio"]').last().click();
        await escalatorPage.locator("#escalation-note").fill("E2E test - SOPEV escalation note");

        voteButton = await expectOGSClickableByName(escalatorPage, /Vote$/);

        await voteButton.click();

        await expect(
            escalatorPage.getByText("Escalated due to VotingOutcome.VOTED_ESCALATION"),
        ).toBeVisible();

        // Now the previous vote from the initial voter should be gone

        // Make sure the all the escalated voting options are loaded
        const radioButtons = escalatorPage.locator('.action-selector input[type="radio"]');
        await expect(await radioButtons.count()).toBeGreaterThanOrEqual(7);

        // Make sure there are no votes showing
        const voteCounts = escalatorPage.locator(".vote-count");
        for (let i = 0; i < (await voteCounts.count()); i++) {
            const text = await voteCounts.nth(i).textContent();
            expect(text).toBe("(0)");
        }

        //  (we probably should make sure that the report is not acted on with pre-escalation votes,
        //   but that's for another day)
        // reporter cleans up their report
        await reporterPage.goto("/reports-center");
        const myReports = reporterPage.getByText("My Own Reports");
        await expect(myReports).toBeVisible();
        await myReports.click();

        const cancelButton = await expectOGSClickableByName(reporterPage, /Cancel$/);
        await cancelButton.click();
    });
};
