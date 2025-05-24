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

// Naughtily using the DNEA test data for this test.

// cspell:words CmDontNotRep AIER DNOT DNEA

/*
 * Uses init_e2e data:
 * - E2E_CM_DNEA_AI_ACCUSED : user supposedly used AI
 * - "E2E CM DNEA Game" : game in which the AI use supposedly occurred
 * - E2E_CM_DNEA_AI_V1, E2E_CM_DNEA_AI_V2, E2E_CM_DNEA_AI_V3 : AI assessors who vote
 * - E2E_CM_DNEA_AI_D1 : AI detector who can escalate reports
 * - E2E_CM_DNEA_AI_DETECTOR : CM AI Detector who should not be notified
 * - E2E_CM_DNEA_AI_ASSESSOR : CM AI Assessor who should not be notified
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

export const cmAiAssessDismissTest = async (
    { browser }: { browser: Browser },
    testInfo: TestInfo,
) => {
    await withIncidentIndicatorLock(testInfo, async () => {
        const { userPage: reporterPage } = await prepareNewUser(
            browser,
            newTestUsername("CmDontNotRep"), // cspell:disable-line
            "test",
        );

        // Report someone for AI use
        await goToUsersGame(reporterPage, "E2E_CM_DNEA_AI_ACCUSED", "E2E CM DNEA Game");

        await reportUser(
            reporterPage,
            "E2E_CM_DNEA_AI_ACCUSED",
            "ai_use",
            "E2E test reporting AI use: I'm sure he cheated!", // min 40 chars
        );

        const aiDetectorUser = "E2E_CM_DNEA_AI_D1";
        const { seededCMPage: aiDetectorCMPage } = await setupSeededCM(browser, aiDetectorUser);

        // The Detector has to vote it for assessment

        const indicator = await assertIncidentReportIndicatorActive(aiDetectorCMPage, 1);

        await indicator.click();

        await expect(
            aiDetectorCMPage.getByRole("heading", { name: "Reports Center" }),
        ).toBeVisible();

        await expect(
            aiDetectorCMPage.getByText("E2E test reporting AI use: I'm sure he cheated!"),
        ).toBeVisible();

        // Select the "assess" option...
        await aiDetectorCMPage.locator('.action-selector input[type="radio"]').nth(1).click();

        // ... then we should be allowed to vote.
        const voteButton = await expectOGSClickableByName(aiDetectorCMPage, /Vote$/);
        await voteButton.click();

        // It should have gone to the assessor queue
        await assertIncidentReportIndicatorInactive(aiDetectorCMPage);

        // Now the CM AI assessors should see it and have to vote
        const aiAssessors = ["E2E_CM_DNEA_AI_V1", "E2E_CM_DNEA_AI_V2", "E2E_CM_DNEA_AI_V3"];

        const aiAssessorContexts = [];
        for (const aiUser of aiAssessors) {
            const { seededCMPage: aiCMPage, seededCMContext: aiContext } = await setupSeededCM(
                browser,
                aiUser,
            );

            aiAssessorContexts.push({ aiCMPage, aiContext }); // keep them alive for the duration of the test, for debugging

            const indicator = await assertIncidentReportIndicatorActive(aiCMPage, 1);

            await indicator.click();

            await expect(aiCMPage.getByRole("heading", { name: "Reports Center" })).toBeVisible();

            await expect(
                aiCMPage.getByText("E2E test reporting AI use: I'm sure he cheated!"),
            ).toBeVisible();

            // Select the not AI option...
            await aiCMPage.locator('.action-selector input[type="radio"]').nth(1).click();

            // ... then we should be allowed to vote.

            const voteButton = await expectOGSClickableByName(aiCMPage, /Vote$/);
            await voteButton.click();
        }

        // the report should be dealt with now from their perspective
        await assertIncidentReportIndicatorInactive(aiAssessorContexts[0].aiCMPage);

        // it should be back in the AI Detection queue

        await assertIncidentReportIndicatorActive(aiDetectorCMPage, 1);

        // and the reporter should see it still
        await reporterPage.goto("/reports-center");
        await expect(reporterPage.getByText("My Own Reports")).toBeVisible();

        // the AI Detector should be able to dismiss it

        // Select the "dismiss" option...
        await aiDetectorCMPage.locator('.action-selector input[type="radio"]').nth(2).click();

        await voteButton.click();

        // it should be gone
        await assertIncidentReportIndicatorInactive(aiDetectorCMPage);
        await assertIncidentReportIndicatorInactive(reporterPage);
    });
};
