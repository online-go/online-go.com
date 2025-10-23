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
    captureReportNumber,
    goToUsersFinishedGame,
    navigateToReport,
    newTestUsername,
    prepareNewUser,
    reportUser,
    setupSeededCM,
} from "@helpers/user-utils";

import { expectOGSClickableByName } from "@helpers/matchers";
import { expect } from "@playwright/test";

import { withReportCountTracking } from "@helpers/report-utils";

export const cmAiAssessDismissTest = async (
    { browser }: { browser: Browser },
    testInfo: TestInfo,
) => {
    const { userPage: reporterPage } = await prepareNewUser(
        browser,
        newTestUsername("CmDontNotRep"), // cspell:disable-line
        "test",
    );

    await withReportCountTracking(reporterPage, testInfo, async (tracker) => {
        // Report someone for AI use
        await goToUsersFinishedGame(reporterPage, "E2E_CM_DNEA_AI_ACCUSED", "E2E CM DNEA Game");

        await reportUser(
            reporterPage,
            "E2E_CM_DNEA_AI_ACCUSED",
            "ai_use",
            "E2E test reporting AI use: I'm sure he cheated!", // min 40 chars
        );

        // Verify reporter's count increased by 1
        await tracker.assertCountIncreasedBy(reporterPage, 1);

        // Capture the report number from the reporter's "My Own Reports" page
        const reportNumber = await captureReportNumber(reporterPage);

        const aiDetectorUser = "E2E_CM_DNEA_AI_D1";
        const { seededCMPage: aiDetectorCMPage } = await setupSeededCM(browser, aiDetectorUser);

        // The Detector has to vote it for assessment
        // Navigate directly to the report using the captured report number
        await navigateToReport(aiDetectorCMPage, reportNumber);

        // Verify we can see the full report with the message
        await expect(
            aiDetectorCMPage.getByText("E2E test reporting AI use: I'm sure he cheated!"),
        ).toBeVisible();

        // Select the "assess" option...
        await aiDetectorCMPage.locator('.action-selector input[type="radio"]').nth(2).click();

        // ... then we should be allowed to vote.
        const voteButton = await expectOGSClickableByName(aiDetectorCMPage, /Vote$/);
        await voteButton.click();

        // Now the CM AI assessors should see it and have to vote
        const aiAssessors = ["E2E_CM_DNEA_AI_V1", "E2E_CM_DNEA_AI_V2", "E2E_CM_DNEA_AI_V3"];

        const aiAssessorContexts = [];
        for (const aiUser of aiAssessors) {
            const { seededCMPage: aiCMPage, seededCMContext: aiContext } = await setupSeededCM(
                browser,
                aiUser,
            );

            aiAssessorContexts.push({ aiCMPage, aiContext }); // keep them alive for the duration of the test, for debugging

            // Navigate directly to the report using the captured report number
            await navigateToReport(aiCMPage, reportNumber);

            // Verify we can see the full report with the message
            await expect(
                aiCMPage.getByText("E2E test reporting AI use: I'm sure he cheated!"),
            ).toBeVisible();

            // Select the not AI option...
            await aiCMPage.locator('.action-selector input[type="radio"]').nth(1).click();

            // ... then we should be allowed to vote.

            const voteButton = await expectOGSClickableByName(aiCMPage, /Vote$/);
            await voteButton.click();
        }

        // and the reporter should see it still
        await reporterPage.goto("/reports-center");
        await expect(reporterPage.getByText("My Own Reports")).toBeVisible();

        // the AI Detector should be able to dismiss it
        // After the assessors vote, navigate directly back to the report
        await navigateToReport(aiDetectorCMPage, reportNumber);

        // Verify we can see the full report with the message
        await expect(
            aiDetectorCMPage.getByText("E2E test reporting AI use: I'm sure he cheated!"),
        ).toBeVisible();

        // Select the "dismiss" option...
        // Note: Index may vary based on what options are available
        await aiDetectorCMPage.locator('.action-selector input[type="radio"]').nth(3).click();

        // Click the vote button (find it fresh on this page)
        const dismissVoteButton = await expectOGSClickableByName(aiDetectorCMPage, /Vote$/);
        await dismissVoteButton.click();

        // After dismissal, the reporter's count should return to initial
        await tracker.assertCountReturnedToInitial(reporterPage);
    });
};
