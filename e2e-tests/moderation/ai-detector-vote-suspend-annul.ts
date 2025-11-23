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

/*
 * Test AI Detector Vote to Suspend and Annul
 *
 * This test verifies that:
 * 1. A player can report another player for AI use after a game
 * 2. The E2E_AI_DETECTOR can see and vote on the AI use report
 * 3. The AI detector can vote to suspend and annul
 * 4. The E2E_MODERATOR can verify the user is suspended
 *
 * Uses seeded users:
 * - E2E_AI_DETECTOR: AI Detector with AI_DETECTOR moderator powers
 * - E2E_MODERATOR: Full moderator to verify suspension
 *
 * Requires environment variables:
 * - E2E_MODERATOR_PASSWORD: Password for both E2E_MODERATOR and E2E_AI_DETECTOR
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, expect } from "@playwright/test";
import {
    captureReportNumber,
    generateUniqueTestIPv6,
    goToUsersProfile,
    loginAsUser,
    navigateToReport,
    newTestUsername,
    prepareNewUser,
    turnOffDynamicHelp,
} from "@helpers/user-utils";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";
import { withIncidentIndicatorLock } from "@helpers/report-utils";
import { log } from "@helpers/logger";

export const aiDetectorVoteSuspendAndAnnulTest = async (
    {
        createContext,
    }: {
        createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
    },
    testInfo: any,
) => {
    return withIncidentIndicatorLock(testInfo, async () => {
        log("=== AI Detector Vote to Suspend and Annul Test ===");

        // Check for required password
        const password = process.env.E2E_MODERATOR_PASSWORD;
        if (!password) {
            throw new Error(
                "E2E_MODERATOR_PASSWORD environment variable must be set to run this test",
            );
        }

        // 1. Create two users who will play a game
        log("Creating reporter user...");
        const reporterUsername = newTestUsername("aiDetVSAReporter");
        const { userPage: reporterPage } = await prepareNewUser(
            createContext,
            reporterUsername,
            "test",
        );
        log(`Reporter user created: ${reporterUsername} ✓`);

        log("Creating reported user (alleged AI user)...");
        const reportedUsername = newTestUsername("aiDetVSAReported");
        const { userPage: reportedPage } = await prepareNewUser(
            createContext,
            reportedUsername,
            "test",
        );
        log(`Reported user created: ${reportedUsername} ✓`);

        // 2. Play a game between the two users
        log("Setting up game...");
        const boardSize = "19x19";
        const handicap = 0;

        await createDirectChallenge(reporterPage, reportedUsername, {
            ...defaultChallengeSettings,
            gameName: "E2E AI Detector Test Game",
            boardSize: boardSize,
            speed: "live",
            timeControl: "byoyomi",
            mainTime: "45",
            timePerPeriod: "10",
            periods: "1",
            handicap: handicap.toString(),
        });

        await acceptDirectChallenge(reportedPage);
        log("Game created and accepted ✓");

        // Wait for the Goban to be visible & ready
        const goban = reporterPage.locator(".Goban[data-pointers-bound]");
        await goban.waitFor({ state: "visible" });

        // Play some moves
        log("Playing game moves...");
        const moves = [
            "P4",
            "D3",
            "Q16",
            "D16",
            "N16",
            "P16",
            "P15",
            "Q15",
            "Q14",
            "O15",
            "P17",
            "O16",
        ];

        await playMoves(reporterPage, reportedPage, moves, boardSize, handicap);
        log("Moves played ✓");

        // Finish the game with passes
        log("Finishing game with passes...");
        const reporterPass = reporterPage.getByText("Pass", { exact: true });
        await expect(reporterPass).toBeVisible();
        await reporterPass.click();

        const reportedPass = reportedPage.getByText("Pass", { exact: true });
        await expect(reportedPass).toBeVisible();
        await reportedPass.click();

        // Accept scoring
        const reportedAccept = reportedPage.getByText("Accept");
        await expect(reportedAccept).toBeVisible();
        await reportedAccept.click();

        const reporterAccept = reporterPage.getByText("Accept");
        await expect(reporterAccept).toBeVisible();
        await reporterAccept.click();

        // Verify game is finished
        const reporterFinished = reporterPage.getByText("wins by");
        await expect(reporterFinished).toBeVisible();
        log("Game finished ✓");

        // 3. Reporter reports the other player for AI use
        log(`Reporting ${reportedUsername} for AI use...`);

        // Click on the reported player's name
        const playerLink = reporterPage.locator(`.white.player-name-container a.Player`);
        await expect(playerLink).toBeVisible();
        await playerLink.click();

        // Click the Report button
        const reportButton = await expectOGSClickableByName(reporterPage, /Report$/);
        await reportButton.click();

        await expect(reporterPage.getByText("Request Moderator Assistance")).toBeVisible();

        // Select AI use report type
        await reporterPage.selectOption(".type-picker select", { value: "ai_use" });

        // Fill in the notes
        const notesBox = reporterPage.locator(".notes");
        await expect(notesBox).toBeVisible();
        await notesBox.fill("E2E test - This player is using AI assistance");

        // Submit the report
        const submitReportButton = await expectOGSClickableByName(reporterPage, /Report User$/);
        await submitReportButton.click();
        log("AI use report submitted ✓");

        // Capture the report number from the reporter's page
        const reportNumber = await captureReportNumber(reporterPage);
        log(`Report number captured: ${reportNumber} ✓`);

        // 4. Set up AI Detector user
        log("Setting up E2E_AI_DETECTOR user...");
        const uniqueIPv6 = generateUniqueTestIPv6();
        const aiDetectorContext = await createContext({
            extraHTTPHeaders: {
                "X-Forwarded-For": uniqueIPv6,
            },
        });
        const aiDetectorPage = await aiDetectorContext.newPage();
        await loginAsUser(aiDetectorPage, "E2E_AI_DETECTOR", password);
        await turnOffDynamicHelp(aiDetectorPage);
        log("E2E_AI_DETECTOR logged in ✓");

        // 5. AI Detector navigates to the specific report
        log(`AI Detector navigating to report ${reportNumber}...`);
        await navigateToReport(aiDetectorPage, reportNumber);
        log("Navigated to report ✓");

        // Verify the report type is AI Use (use .first() to avoid strict mode violation)
        await expect(aiDetectorPage.getByText("AI Use").first()).toBeVisible();
        log("Confirmed report type is AI Use ✓");

        // Verify the reported user is shown (use .first() to avoid strict mode violation)
        await expect(aiDetectorPage.getByText(reportedUsername).first()).toBeVisible();
        log(`Confirmed report is about ${reportedUsername} ✓`);

        // 6. AI Detector votes to suspend and annul
        log("AI Detector voting to suspend and annul...");

        // Select the "Suspend AI user, annul cheated games" radio button by clicking the input
        const suspendRadio = aiDetectorPage.locator('input[value="suspend_ai_user"]');
        await suspendRadio.click();

        // Wait for the radio button to be checked
        await expect(suspendRadio).toBeChecked();
        log("Selected 'Suspend AI user, annul cheated games' action ✓");

        // Click the Vote button to submit the vote
        const voteButton = await expectOGSClickableByName(aiDetectorPage, /^Vote$/);
        await expect(voteButton).toBeVisible();
        await expect(voteButton).toBeEnabled();
        await voteButton.click();
        log("Vote submitted ✓");

        // Wait for vote to be processed - check that Vote button is disabled or hidden
        await expect(voteButton)
            .toBeDisabled({ timeout: 5000 })
            .catch(() => {
                // Button might be hidden instead of disabled
            });

        // 7. Set up moderator to verify suspension
        log("Setting up E2E_MODERATOR to verify suspension...");
        const modUniqueIPv6 = generateUniqueTestIPv6();
        const modContext = await createContext({
            extraHTTPHeaders: {
                "X-Forwarded-For": modUniqueIPv6,
            },
        });
        const modPage = await modContext.newPage();
        await loginAsUser(modPage, "E2E_MODERATOR", password);
        await turnOffDynamicHelp(modPage);
        log("E2E_MODERATOR logged in ✓");

        // 8. Moderator checks the reported user's profile to verify suspension
        log(`Moderator navigating to ${reportedUsername}'s profile...`);
        await goToUsersProfile(modPage, reportedUsername);
        log("User profile loaded ✓");

        // Moderators can see a table with a "Suspended" column on the profile page
        // (rendered by ModTools.tsx in moderator-ui submodule)
        // The suspended column shows "Yes" (capitalized) for suspended users
        log("Checking for suspension status in 'Users with the same IP or Browser ID' table...");

        // Find the table with "Suspended" column header
        const tableWithSuspendedColumn = modPage.locator("table").filter({ hasText: "Suspended" });
        await expect(tableWithSuspendedColumn).toBeVisible({ timeout: 10000 });
        log("Found table with 'Suspended' column ✓");

        // Check for "Yes" (capitalized) in the suspended column
        const suspendedYes = tableWithSuspendedColumn.getByText("Yes", { exact: true });
        await expect(suspendedYes).toBeVisible({ timeout: 5000 });
        log("User is confirmed suspended (found 'Yes' in Suspended column) ✓");

        log("=== Test Complete ===");
        log("✓ Game played between two users");
        log("✓ Reporter submitted AI use report");
        log("✓ Report captured and navigated to by AI Detector");
        log("✓ AI Detector successfully voted to suspend and annul");
        log("✓ User is confirmed suspended after AI detector vote");
        log("Note: Annulment cannot be easily verified in E2E tests");
    });
};
