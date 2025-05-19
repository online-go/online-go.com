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

// cspell:words AA

/*
 * Uses init_e2e data:
 * - E2E_CM_AA_ACCUSED : user supposedly score cheated
 * - "E2E CM AA Game" : game in which the score cheat supposedly occurred
 * - E2E_CM_AA_V1, E2E_CM_AA_V2, E2E_CM_AA_V3 : assessors who vote
 */

import { Browser, TestInfo } from "@playwright/test";

import {
    assertIncidentReportIndicatorActive,
    assertIncidentReportIndicatorInactive,
    goToUsersGame,
    newTestUsername,
    prepareNewUser,
    reportUser,
    setupSeededCM,
} from "@helpers/user-utils";

import { expectOGSClickableByName } from "@helpers/matchers";
import { expect } from "@playwright/test";

import { withIncidentIndicatorLock } from "@helpers/report-utils";

export const cmAckAcknowledgementTest = async (
    { browser }: { browser: Browser },
    testInfo: TestInfo,
) => {
    await withIncidentIndicatorLock(testInfo, async () => {
        const { userPage: reporterPage } = await prepareNewUser(
            browser,
            newTestUsername("CmAAReporter"), // cspell:disable-line
            "test",
        );

        // Report someone for score cheating
        await goToUsersGame(reporterPage, "E2E_CM_AA_ACCUSED", "E2E CM AA Game");

        await reportUser(reporterPage, "E2E_CM_AA_ACCUSED", "score_cheating", "he's a cheater!");

        // Vote to tell the reporter that there's no score cheating

        const cmAssessors = ["E2E_CM_AA_V1", "E2E_CM_AA_V2", "E2E_CM_AA_V3"];

        const cmAssessorContexts = [];
        for (const cmUser of cmAssessors) {
            const { seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
                browser,
                cmUser,
            );

            cmAssessorContexts.push({ CMPage: cmPage, cmContext }); // keep them alive for the duration of the test

            const indicator = await assertIncidentReportIndicatorActive(cmPage, 1);

            await indicator.click();

            await expect(cmPage.getByRole("heading", { name: "Reports Center" })).toBeVisible();

            await expect(cmPage.getByText("he's a cheater!")).toBeVisible();

            // Select the no cheating...
            await cmPage.locator('.action-selector input[type="radio"]').nth(2).click();

            const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
            await voteButton.click();
        }

        // The report should no longer be active
        await assertIncidentReportIndicatorInactive(cmAssessorContexts[0].CMPage);

        // The reporters should no longer have the report active either
        await assertIncidentReportIndicatorInactive(reporterPage);

        // The reporter should see an acknowledgement
        await reporterPage.goto("/");

        await expect(reporterPage.locator("div.AccountWarningAck")).toBeVisible();

        await expect(
            reporterPage
                .locator("div.AccountWarningAck")
                .locator("div.canned-message.no_score_cheating_evident"),
        ).toBeVisible();

        let okButton = reporterPage.locator("div.AccountWarningAck").locator("button.primary");
        await expect(okButton).toBeVisible();
        await expect(okButton).toBeEnabled(); // acks are enabled immediately

        // Since its an acknowledgement, they _should_ be able to play
        await reporterPage.goto("/play");

        const playComputerButton = reporterPage.locator("button.play-button", {
            hasText: "Play Computer",
        });
        await expect(playComputerButton).toBeEnabled();

        const playHumanButton = reporterPage.locator("button.play-button", {
            hasText: "Play Human",
        });
        await expect(playHumanButton).toBeEnabled();

        // The message got reloaded when we went to /play

        okButton = reporterPage.locator("div.AccountWarningAck").locator("button.primary");
        await expect(okButton).toBeVisible();
        await expect(okButton).toBeEnabled();

        await okButton.click();

        await expect(reporterPage.locator("div.AccountWarningAck")).not.toBeVisible();

        // And play of course
        await expect(playComputerButton).toBeVisible();
        await expect(playHumanButton).toBeVisible();
        await expect(playComputerButton).toBeEnabled();
        await expect(playHumanButton).toBeEnabled();
    });
};
