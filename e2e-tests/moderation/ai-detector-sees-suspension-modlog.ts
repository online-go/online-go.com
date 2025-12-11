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
 * Test that AI Detectors can see SUSPENSION ModLog entries
 *
 * This test verifies that:
 * 1. A user plays a game and gets suspended by a moderator
 * 2. The user is restored via the appeals process
 * 3. An AI use report is created about one of their games
 * 4. The AI Detector can view the report and see the SUSPENSION ModLog entries
 * 5. Both suspension and restoration entries are visible in the ModLog
 *
 * Uses seeded users:
 * - E2E_MODERATOR: Full moderator to suspend/restore users
 * - E2E_AI_DETECTOR: AI Detector with AI_DETECTOR moderator powers
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
import { expectOGSClickableByName } from "@helpers/matchers";
import { IncidentReportCountTracker, withIncidentIndicatorLock } from "@helpers/report-utils";
import { log } from "@helpers/logger";

export const aiDetectorSeesSuspensionModlogTest = async (
    {
        createContext,
    }: {
        createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
    },
    testInfo: any,
) => {
    return withIncidentIndicatorLock(testInfo, async () => {
        log("=== AI Detector Sees SUSPENSION ModLog Test ===");

        // Check for required password
        const password = process.env.E2E_MODERATOR_PASSWORD;
        if (!password) {
            throw new Error(
                "E2E_MODERATOR_PASSWORD environment variable must be set to run this test",
            );
        }

        // Initialize report count tracker
        const reportTracker = new IncidentReportCountTracker();

        // 1. Create the user who will be suspended
        log("Creating user who will be suspended...");
        const suspendedUsername = newTestUsername("SuspModLog");
        const { userPage: suspendedUserPage } = await prepareNewUser(
            createContext,
            suspendedUsername,
            "test",
        );
        log(`User created: ${suspendedUsername}`);

        // 2. Create opponent user for the game
        log("Creating opponent user...");
        const opponentUsername = newTestUsername("SuspMLOpp");
        const { userPage: opponentPage } = await prepareNewUser(
            createContext,
            opponentUsername,
            "test",
        );
        log(`Opponent created: ${opponentUsername}`);

        // 3. Play a game between the two users (end with passes)
        log("Setting up game...");
        log("Creating direct challenge...");
        // Use same time controls as working tests (ai-detector-vote-suspend-annul.ts)
        await createDirectChallenge(suspendedUserPage, opponentUsername, {
            ...defaultChallengeSettings,
            gameName: "E2E Suspension ModLog Test Game",
            boardSize: "9x9",
            speed: "live",
            timeControl: "byoyomi",
            mainTime: "45",
            timePerPeriod: "10",
            periods: "1",
            handicap: "0",
        });
        log("Challenge sent");

        await acceptDirectChallenge(opponentPage);
        log("Game created and accepted");

        // Wait for the Goban to be ready
        const goban = suspendedUserPage.locator(".Goban[data-pointers-bound]");
        await goban.waitFor({ state: "visible" });

        // End the game with passes (more reliable than resignation)
        log("Ending game with passes...");

        // Wait for black (suspended user) to have their turn first
        await expect(suspendedUserPage.getByText("Your move")).toBeVisible({ timeout: 10000 });
        log("Black's turn confirmed");

        // Black passes
        const blackPass = suspendedUserPage.getByText("Pass", { exact: true });
        await expect(blackPass).toBeVisible();
        await blackPass.click();
        log("Black passed");

        // Wait for white (opponent) to see it's their turn
        await expect(opponentPage.getByText("Your move")).toBeVisible({ timeout: 10000 });
        log("White's turn confirmed");

        // White passes
        const whitePass = opponentPage.getByText("Pass", { exact: true });
        await expect(whitePass).toBeVisible();
        await whitePass.click();
        log("White passed");

        // Weird OGS behaviour - black has to pass twice if no moves are played!
        const blackPass2 = suspendedUserPage.getByText("Pass", { exact: true });
        await expect(blackPass2).toBeVisible();
        await blackPass2.click();
        log("Black passed again");

        // Wait for scoring phase - Accept buttons should appear on both sides
        const whiteAccept = opponentPage.getByText("Accept");
        await expect(whiteAccept).toBeVisible({ timeout: 10000 });
        await whiteAccept.click();
        log("White accepted score");

        const blackAccept = suspendedUserPage.getByText("Accept");
        await expect(blackAccept).toBeVisible({ timeout: 10000 });
        await blackAccept.click();
        log("Black accepted score");

        // Verify game is finished
        await expect(suspendedUserPage.getByText("wins by")).toBeVisible({ timeout: 10000 });
        log("Game finished");

        // 4. Set up moderator to suspend the user
        log("Setting up moderator to suspend user...");
        const modIPv6 = generateUniqueTestIPv6();
        const modContext = await createContext({
            extraHTTPHeaders: {
                "X-Forwarded-For": modIPv6,
            },
        });
        const modPage = await modContext.newPage();
        await loginAsUser(modPage, "E2E_MODERATOR", password);
        await turnOffDynamicHelp(modPage);
        log("E2E_MODERATOR logged in");

        // Navigate to the user's profile and suspend them
        log(`Moderator suspending user: ${suspendedUsername}`);
        await goToUsersProfile(modPage, suspendedUsername);

        // Click on the player link to open the dropdown menu
        const playerLink = modPage.locator(`a.Player:has-text("${suspendedUsername}")`).first();
        await expect(playerLink).toBeVisible();
        await playerLink.hover();
        await playerLink.click();

        // Click the Suspend button
        const suspendButton = await expectOGSClickableByName(modPage, /Suspend/);
        await suspendButton.click();

        // Fill in the BanModal
        await expect(modPage.locator(".BanModal")).toBeVisible();
        const publicReasonTextarea = modPage.locator(".BanModal textarea").first();
        await publicReasonTextarea.fill("E2E test suspension for ModLog visibility test");
        await expect(publicReasonTextarea).toHaveValue(
            "E2E test suspension for ModLog visibility test",
        );

        // Confirm suspension
        const confirmSuspendButton = await expectOGSClickableByName(modPage, /^Suspend$/);
        await confirmSuspendButton.click();
        await expect(modPage.locator(".BanModal")).toBeHidden();
        log("User suspended");

        // 5. User sees suspension banner and submits appeal
        log("User submitting appeal...");
        await suspendedUserPage.goto("/");
        await expect(suspendedUserPage.getByText("Your account has been suspended")).toBeVisible();

        const appealLink = suspendedUserPage.getByRole("link", { name: /appeal here/i });
        await expect(appealLink).toBeVisible();
        await appealLink.click();

        // Submit an appeal message
        const appealTextarea = suspendedUserPage.locator(".input-card textarea");
        await expect(appealTextarea).toBeVisible();
        await appealTextarea.fill("E2E test appeal message");
        await expect(appealTextarea).toHaveValue("E2E test appeal message");

        const submitAppealButton = await expectOGSClickableByName(suspendedUserPage, /^Submit$/);
        await submitAppealButton.click();
        await expect(submitAppealButton).toBeDisabled();
        log("Appeal submitted");

        // 6. Moderator restores the user via Appeals Centre
        log("Moderator restoring user via Appeals Centre...");
        await modPage.goto("/appeals-center");
        await expect(modPage.getByRole("heading", { name: /Appeals Center/i })).toBeVisible();

        // Find and click the user's appeal
        const appealRow = modPage.locator(".PaginatedTable tr", { hasText: suspendedUsername });
        await expect(appealRow).toBeVisible();
        const stateCell = appealRow.locator("td.state").last();
        await stateCell.click();

        // Wait for the appeal to load
        await expect(modPage.getByText(/E2E test appeal message/i)).toBeVisible();

        // Restore the account
        const restoreTextarea = modPage.locator(".input-card textarea");
        await expect(restoreTextarea).toBeVisible();
        await restoreTextarea.fill("E2E test - Account restored");
        await expect(restoreTextarea).toHaveValue("E2E test - Account restored");

        const restoreButton = await expectOGSClickableByName(modPage, /Restore Account/);
        await expect(restoreButton).toBeVisible();
        await restoreButton.click();
        log("User restored");

        // 7. Create an AI use report about the suspended user's game
        log("Creating AI use report...");
        // Go to opponent's finished game
        await opponentPage.goto("/");

        // Navigate to the game via profile
        await goToUsersProfile(opponentPage, suspendedUsername);

        // Find the game in Game History
        const gameHistory = opponentPage.getByText("Game History");
        await gameHistory.scrollIntoViewIfNeeded();
        await expect(gameHistory).toBeVisible();

        const targetGame = opponentPage.getByText("E2E Suspension ModLog Test Game").first();
        await expect(targetGame).toBeVisible();
        await targetGame.click();
        await expect(opponentPage.locator(".Game")).toBeVisible();

        // Wait for game components to fully load (Goban must be ready for interactions)
        const gobanReady = opponentPage.locator(".Goban[data-pointers-bound]");
        await gobanReady.waitFor({ state: "visible" });
        // Wait for network to settle after game page navigation to ensure all player data is loaded
        await opponentPage.waitForLoadState("networkidle");
        log("Game page fully loaded");

        // Report the user for AI use
        // Use same pattern as reportPlayerByColor helper: hover before click to stabilize popover
        const reportPlayerLink = opponentPage.locator(`.black.player-name-container a.Player`);
        await expect(reportPlayerLink).toBeVisible();
        // Wait for the element to be stable (attached to DOM and not moving)
        await reportPlayerLink.waitFor({ state: "attached" });
        await reportPlayerLink.hover();
        await reportPlayerLink.click();

        // Wait for popover to appear, then find and click the Report button
        const reportButton = await expectOGSClickableByName(opponentPage, /Report$/);
        await reportButton.click();

        await expect(opponentPage.getByText("Request Moderator Assistance")).toBeVisible();
        await opponentPage.selectOption(".type-picker select", { value: "ai_use" });

        const notesBox = opponentPage.locator(".notes");
        await expect(notesBox).toBeVisible();
        await notesBox.fill("E2E test - Reporting for AI use to test ModLog visibility");

        const submitReportButton = await expectOGSClickableByName(opponentPage, /Report User$/);
        await submitReportButton.click();
        log("AI use report submitted");

        // Capture the report number
        const reportNumber = await captureReportNumber(opponentPage);
        log(`Report number captured: ${reportNumber}`);

        // 8. Set up AI Detector to view the report
        log("Setting up E2E_AI_DETECTOR...");
        const aiDetectorIPv6 = generateUniqueTestIPv6();
        const aiDetectorContext = await createContext({
            extraHTTPHeaders: {
                "X-Forwarded-For": aiDetectorIPv6,
            },
        });
        const aiDetectorPage = await aiDetectorContext.newPage();
        await loginAsUser(aiDetectorPage, "E2E_AI_DETECTOR", password);
        await turnOffDynamicHelp(aiDetectorPage);
        log("E2E_AI_DETECTOR logged in");

        // Capture initial report count
        await reportTracker.captureInitialCount(aiDetectorPage);
        log("Initial report count captured");

        // 9. AI Detector navigates to the report
        log(`AI Detector navigating to report ${reportNumber}...`);
        await navigateToReport(aiDetectorPage, reportNumber);
        log("Navigated to report");

        // Verify we're on the right report
        await expect(aiDetectorPage.getByText("AI Use").first()).toBeVisible();
        await expect(aiDetectorPage.getByText(suspendedUsername).first()).toBeVisible();
        log("Confirmed report details");

        // 10. Expand the UserHistory ModLog section
        log("Expanding ModLog section...");
        const historyHeader = aiDetectorPage.getByText(`History for`);
        await expect(historyHeader).toBeVisible();

        // Click the caret to expand the ModLog (for non-moderators with moderator_powers)
        const expandCaret = aiDetectorPage.locator(".fa-caret-right.clickable");
        await expect(expandCaret).toBeVisible();
        await expandCaret.click();
        log("ModLog section expanded");

        // 11. Verify SUSPENSION ModLog entries are visible
        log("Verifying SUSPENSION ModLog entries...");

        // Check for suspension entry (is_banned False => True)
        const suspensionEntry = aiDetectorPage
            .locator(".moderator-log")
            .getByText(/is_banned.*False.*=>.*True/i);
        await expect(suspensionEntry).toBeVisible({ timeout: 10000 });
        log("Suspension entry visible (is_banned False => True)");

        // Check for restoration entry (is_banned True => False)
        const restorationEntry = aiDetectorPage
            .locator(".moderator-log")
            .getByText(/is_banned.*True.*=>.*False/i);
        await expect(restorationEntry).toBeVisible({ timeout: 10000 });
        log("Restoration entry visible (is_banned True => False)");

        // Clean up: Close the report by voting to cancel ticket
        log("Cleaning up - voting to cancel ticket...");

        // Select the "Cancel ticket" radio button
        const cancelRadio = aiDetectorPage.locator('input[value="cancel_ai_ticket"]');
        await cancelRadio.click();
        await expect(cancelRadio).toBeChecked();
        log("Selected 'Cancel ticket' action");

        // Click the Vote button to submit the vote
        const voteButton = await expectOGSClickableByName(aiDetectorPage, /^Vote$/);
        await expect(voteButton).toBeVisible();
        await expect(voteButton).toBeEnabled();
        await voteButton.click();
        log("Vote submitted");

        // Wait for vote to be processed - Vote button becomes disabled
        await expect(voteButton).toBeDisabled({ timeout: 5000 });
        log("Report closed via cancel ticket vote");

        // Verify report count returned to initial
        await reportTracker.assertCountReturnedToInitial(aiDetectorPage);
        log("Report count returned to initial - report was properly closed");

        log("=== AI Detector Sees SUSPENSION ModLog Test Complete ===");
        log("User suspended by moderator");
        log("User restored via appeals process");
        log("AI use report created about user's game");
        log("AI Detector can see SUSPENSION ModLog entries in ViewReport UserHistory");
        log("Both suspension and restoration entries are visible");
        log("Report closed via cancel ticket vote");
    });
};
