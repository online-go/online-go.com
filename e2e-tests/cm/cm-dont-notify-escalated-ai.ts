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

// cspell:words CmDontNotRep AIER DNOT DNEA

/*
 * Uses init_e2e data:
 * - E2E_CM_DNEA_AI_ACCUSED : user supposedly used AI
 * - "E2E CM DNEA Game" : game in which the AI use supposedly occurred
 * - E2E_CM_DNEA_AI_V1, E2E_CM_DNEA_AI_V2, E2E_CM_DNEA_AI_V3 : AI assessors who vote
 * - E2E_CM_DNEA_AI_ASSESSOR : CM AI Assessor who should not be notified
 */

import { Browser } from "@playwright/test";

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

export const cmDontNotifyEscalatedAiTest = async ({ browser }: { browser: Browser }) => {
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

    // Vote the report into moderation queue

    const aiAssessors = ["E2E_CM_DNEA_AI_V1", "E2E_CM_DNEA_AI_V2", "E2E_CM_DNEA_AI_V3"];

    const aiAssessorContexts = [];
    for (const aiUser of aiAssessors) {
        const { seededCMPage: aiCMPage, seededCMContext: aiContext } = await setupSeededCM(
            browser,
            aiUser,
        );

        aiAssessorContexts.push(aiContext); // keep them alive for the duration of the test, for debugging

        const indicator = await assertIncidentReportIndicatorActive(aiCMPage, 1);

        await indicator.click();

        await expect(aiCMPage.getByRole("heading", { name: "Reports Center" })).toBeVisible();

        await expect(
            aiCMPage.getByText("E2E test reporting AI use: I'm sure he cheated!"),
        ).toBeVisible();

        // Select the definite AI option...
        await aiCMPage.locator('.action-selector input[type="radio"]').first().click();

        // ... then we should be allowed to vote.

        const voteButton = await expectOGSClickableByName(aiCMPage, /Vote$/);
        await voteButton.click();
    }

    // Now we're going to check that the another CM AI Assessor doesn't get notified
    const { seededCMPage: aiCMPage } = await setupSeededCM(browser, "E2E_CM_DNEA_AI_ASSESSOR");

    await assertIncidentReportIndicatorInactive(aiCMPage);

    // reporter cleans up their report
    await reporterPage.goto("/reports-center");
    const myReports = reporterPage.getByText("My Own Reports");
    await expect(myReports).toBeVisible();
    await myReports.click();

    const cancelButton = await expectOGSClickableByName(reporterPage, /Cancel$/);
    await cancelButton.click();
};
