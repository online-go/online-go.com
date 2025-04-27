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

// cspell:words VWNAI

// this is naughtily reusing the cm-vote-warn-not-ai test data

// it's basically the same test, we just go on to check if the warning
// pops up and can be acknowledged

/*
 * Uses init_e2e data:
 * - E2E_CM_VWNAI_ACCUSED : user supposedly used AI
 * - "E2E CM VWNAI Game" : game in which the AI use supposedly occurred
 * - E2E_CM_VWNAI_AI_V1, E2E_CM_VWNAI_AI_V2, E2E_CM_VWNAI_AI_V3 : AI assessors who vote
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

export const modAckWarningTest = async ({ browser }: { browser: Browser }, testInfo: TestInfo) => {
    await withIncidentIndicatorLock(testInfo, async () => {
        const { userPage: reporterPage } = await prepareNewUser(
            browser,
            newTestUsername("CmVWNAIRep"), // cspell:disable-line
            "test",
        );

        // Report someone for AI use
        await goToUsersGame(reporterPage, "E2E_CM_VWNAI_ACCUSED", "E2E CM VWNAI Game");

        await reportUser(
            reporterPage,
            "E2E_CM_VWNAI_ACCUSED",
            "ai_use",
            "E2E test reporting AI use: I just have this feeling.", // min 40 chars
        );

        // Vote to warn the reporter that it was not a good AI report

        const aiAssessors = ["E2E_CM_VWNAI_AI_V1", "E2E_CM_VWNAI_AI_V2", "E2E_CM_VWNAI_AI_V3"];

        const aiAssessorContexts = [];
        for (const aiUser of aiAssessors) {
            const { seededCMPage: aiCMPage, seededCMContext: aiContext } = await setupSeededCM(
                browser,
                aiUser,
            );

            aiAssessorContexts.push({ aiCMPage, aiContext }); // keep them alive for the duration of the test

            const indicator = await assertIncidentReportIndicatorActive(aiCMPage, 1);

            await indicator.click();

            await expect(aiCMPage.getByRole("heading", { name: "Reports Center" })).toBeVisible();

            await expect(
                aiCMPage.getByText("E2E test reporting AI use: I just have this feeling."),
            ).toBeVisible();

            // Select the definite AI option...
            await aiCMPage.locator('.action-selector input[type="radio"]').nth(3).click();

            const voteButton = await expectOGSClickableByName(aiCMPage, /Vote$/);
            await voteButton.click();
        }

        // The report should no longer be active
        await assertIncidentReportIndicatorInactive(aiAssessorContexts[0].aiCMPage);

        await reporterPage.goto("/");

        await expect(reporterPage.locator("div.AccountWarning")).toBeVisible();

        await expect(
            reporterPage
                .locator("div.AccountWarning")
                .locator("div.canned-message.no_ai_use_bad_report"),
        ).toBeVisible();

        await reporterPage.locator("div.AccountWarning").locator("input[type='checkbox']").click();

        const okButton = reporterPage.locator("div.AccountWarning").locator("button.primary");
        await expect(okButton).toBeVisible();
        await expect(okButton).toBeDisabled();

        // wait 10 seconds before proceeding

        await new Promise((resolve) => setTimeout(resolve, 10000));

        await expect(okButton).toBeEnabled();

        await okButton.click();

        await expect(reporterPage.locator("div.AccountWarning")).not.toBeVisible();
    });
};
