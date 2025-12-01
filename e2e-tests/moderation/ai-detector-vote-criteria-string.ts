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
 * Test AI Detector Vote Adds Criteria String to Report Moderator Note
 *
 * This test verifies that:
 * 1. A player can report another player for AI use after a game
 * 2. The E2E_AI_DETECTOR can see and vote on the AI use report
 * 3. The AI detector votes to suspend and annul (triggering bulk annulment)
 * 4. After voting, the report's moderator note contains the condensed criteria string
 *
 * Uses seeded users:
 * - E2E_AI_DETECTOR: AI Detector with AI_DETECTOR moderator powers
 *
 * Requires environment variables:
 * - E2E_MODERATOR_PASSWORD: Password for E2E_AI_DETECTOR
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, expect } from "@playwright/test";
import {
    captureReportNumber,
    generateUniqueTestIPv6,
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

export const aiDetectorVoteCriteriaStringTest = async (
    {
        createContext,
    }: {
        createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
    },
    testInfo: any,
) => {
    return withIncidentIndicatorLock(testInfo, async () => {
        log("=== AI Detector Vote Criteria String in Moderator Note Test ===");

        // Check for required password
        const password = process.env.E2E_MODERATOR_PASSWORD;
        if (!password) {
            throw new Error(
                "E2E_MODERATOR_PASSWORD environment variable must be set to run this test",
            );
        }

        // 1. Create two users who will play a game
        log("Creating reporter user...");
        const reporterUsername = newTestUsername("aiCritReporter");
        const { userPage: reporterPage } = await prepareNewUser(
            createContext,
            reporterUsername,
            "test",
        );
        log(`Reporter user created: ${reporterUsername}`);

        log("Creating reported user (alleged AI user)...");
        const reportedUsername = newTestUsername("aiCritReported");
        const { userPage: reportedPage } = await prepareNewUser(
            createContext,
            reportedUsername,
            "test",
        );
        log(`Reported user created: ${reportedUsername}`);

        // 2. Play a game between the two users
        log("Setting up game...");
        const boardSize = "19x19";
        const handicap = 0;

        await createDirectChallenge(reporterPage, reportedUsername, {
            ...defaultChallengeSettings,
            gameName: "E2E Criteria String Test Game",
            boardSize: boardSize,
            speed: "live",
            timeControl: "byoyomi",
            mainTime: "45",
            timePerPeriod: "10",
            periods: "1",
            handicap: handicap.toString(),
        });

        await acceptDirectChallenge(reportedPage);
        log("Game created and accepted");

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
        log("Moves played");

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
        log("Game finished");

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
        log("AI use report submitted");

        // Capture the report number from the reporter's page
        const reportNumber = await captureReportNumber(reporterPage);
        log(`Report number captured: ${reportNumber}`);

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
        log("E2E_AI_DETECTOR logged in");

        // 5. AI Detector navigates to the specific report
        log(`AI Detector navigating to report ${reportNumber}...`);
        await navigateToReport(aiDetectorPage, reportNumber);
        log("Navigated to report");

        // Verify the report type is AI Use
        await expect(aiDetectorPage.getByText("AI Use").first()).toBeVisible();
        log("Confirmed report type is AI Use");

        // 6. AI Detector votes to suspend and annul (triggers bulk annulment with criteria string)
        log("AI Detector voting to suspend and annul...");

        // Select the "Suspend AI user, annul cheated games" radio button
        const suspendRadio = aiDetectorPage.locator('input[value="suspend_ai_user"]');
        await suspendRadio.click();
        await expect(suspendRadio).toBeChecked();
        log("Selected 'Suspend AI user, annul cheated games' action");

        // Click the Vote button to submit the vote
        const voteButton = await expectOGSClickableByName(aiDetectorPage, /^Vote$/);
        await expect(voteButton).toBeVisible();
        await expect(voteButton).toBeEnabled();
        await voteButton.click();
        log("Vote submitted");

        // Wait for vote to be processed
        await expect(voteButton)
            .toBeDisabled({ timeout: 5000 })
            .catch(() => {
                // Button might be hidden instead of disabled
            });

        // 7. Reload the report page to get updated data with moderator note
        log("Reloading report page to verify moderator note...");
        await aiDetectorPage.reload();
        await aiDetectorPage.waitForLoadState("networkidle");

        // 8. Verify the moderator note section contains the criteria string
        log("Checking for criteria string in moderator note...");

        // The moderator note section has header "Moderator notes" and content in a Card div
        // AI Detectors can see moderator notes on AI use reports
        const moderatorNotesHeader = aiDetectorPage.getByText("Moderator notes");
        await expect(moderatorNotesHeader).toBeVisible({ timeout: 10000 });
        log("Found 'Moderator notes' section");

        // Look for the criteria string pattern in the moderator note
        // Format: "AI-Detector: Bulk annulment performed [criteria: M6B30A100S70D10R60G100]"
        // The criteria string starts with "M" for months_threshold
        const criteriaPattern = /\[criteria: M\d+B\d+A\d+S\d+D\d+R\d+G\d+\]/;

        // Find the notes section that contains the criteria string
        const notesSection = aiDetectorPage
            .locator(".notes")
            .filter({ hasText: "Moderator notes" });
        await expect(notesSection).toBeVisible();

        // Get the Card div inside the notes section that contains the moderator note content
        const moderatorNoteCard = notesSection.locator(".Card");
        await expect(moderatorNoteCard).toBeVisible();

        const moderatorNoteText = await moderatorNoteCard.textContent();
        log(`Moderator note content: ${moderatorNoteText}`);

        // Verify the criteria string is present
        expect(moderatorNoteText).toMatch(criteriaPattern);
        log("Criteria string found in moderator note");

        // Also verify the full expected format
        expect(moderatorNoteText).toContain("AI-Detector: Bulk annulment performed [criteria:");
        log("Full moderator note format verified");

        log("=== Test Complete ===");
        log(
            "Verified: Report moderator note contains condensed criteria string after bulk annulment vote",
        );
    });
};
