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
 * Test Community Moderation voting to suspend users
 *
 * This test verifies the CM escalation and suspension flow with human-readable ban reasons:
 * 1. Two new users play a game to completion
 * 2. Fresh reporter reports one player for escaping (stopped playing)
 * 3. One CM escalates the report (requires only 1 vote)
 * 4. Three CMs vote to suspend (requires 3 votes for consensus)
 * 5. Verifies suspended user sees human-readable ban reason
 *
 * Uses init_e2e data:
 * - E2E_CM_VSU_V1, E2E_CM_VSU_V2, E2E_CM_VSU_V3 : CMs who escalate and vote to suspend
 *
 * Creates fresh users for each test run.
 */

import { Browser, TestInfo, expect } from "@playwright/test";
import {
    captureReportNumber,
    navigateToReport,
    reportUser,
    setupSeededCM,
    prepareNewUser,
    newTestUsername,
} from "@helpers/user-utils";
import {
    createDirectChallenge,
    acceptDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";
import { withReportCountTracking } from "@helpers/report-utils";

export const cmVoteSuspendUserTest = async (
    { browser }: { browser: Browser },
    testInfo: TestInfo,
) => {
    console.log("=== CM Vote Suspend User Test ===");

    // Create two users who will play a game
    console.log("Creating two users to play a game...");
    const accusedUsername = newTestUsername("Accu"); // cspell:ignore Accu
    const opponentUsername = newTestUsername("Opp"); // cspell:ignore Opp

    const { userPage: accusedPage } = await prepareNewUser(browser, accusedUsername, "test");
    const { userPage: opponentPage } = await prepareNewUser(browser, opponentUsername, "test");

    // Have them play a quick 9x9 game
    console.log("Creating and playing game...");
    await createDirectChallenge(accusedPage, opponentUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E CM Suspend Test Game",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "45",
        timePerPeriod: "10",
        periods: "1",
    });

    await acceptDirectChallenge(opponentPage);

    // Wait for the Goban to be visible
    const goban = accusedPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });
    await accusedPage.waitForTimeout(1000);

    // Play a few moves
    const moves = ["D9", "E9", "D8", "E8", "D7", "E7"];
    await playMoves(accusedPage, opponentPage, moves, "9x9");

    // Both players pass to end the game
    const accusedPass = accusedPage.getByText("Pass", { exact: true });
    await expect(accusedPass).toBeVisible();
    await accusedPass.click();

    const opponentPass = opponentPage.getByText("Pass", { exact: true });
    await expect(opponentPass).toBeVisible();
    await opponentPass.click();

    // Accept scores
    const opponentAccept = opponentPage.getByText("Accept");
    await expect(opponentAccept).toBeVisible();
    await opponentAccept.click();

    const accusedAccept = accusedPage.getByText("Accept");
    await expect(accusedAccept).toBeVisible();
    await accusedAccept.click();

    // Wait for game to finish
    await expect(accusedPage.getByText("wins by")).toBeVisible();
    console.log("Game completed ✓");

    // Create a reporter and report the accused user for escaping
    console.log("Creating reporter and reporting user...");
    const reporterUsername = newTestUsername("EscReporter");
    const { userPage: reporterPage } = await prepareNewUser(browser, reporterUsername, "test");

    await withReportCountTracking(reporterPage, testInfo, async (tracker) => {
        // Navigate to the finished game and report
        await reporterPage.goto(accusedPage.url());
        await reporterPage.waitForLoadState("networkidle");

        await reportUser(
            reporterPage,
            accusedUsername,
            "escaping",
            "This user stopped playing and abandoned the game",
        );
        console.log("Report submitted ✓");

        // Verify reporter's count increased by 1
        await tracker.assertCountIncreasedBy(reporterPage, 1);

        // Capture the report number from the reporter's "My Own Reports" page
        const reportNumber = await captureReportNumber(reporterPage);

        // Have one CM escalate the report
        console.log("E2E_CM_VSU_V1 escalating escaping report...");
        const { seededCMPage: escalatorPage } = await setupSeededCM(browser, "E2E_CM_VSU_V1");

        // Navigate directly to the report using the captured report number
        await navigateToReport(escalatorPage, reportNumber);

        await escalatorPage.click('input[value="escalate"]');
        await escalatorPage.fill("#escalation-note", "Repeat offender - needs moderator attention");

        const escalateVoteButton = await expectOGSClickableByName(escalatorPage, /Vote/);
        await escalateVoteButton.click();
        await escalatorPage.waitForLoadState("networkidle");

        console.log("E2E_CM_VSU_V1 escalated the report");
        await escalatorPage.close();

        // Keep the accused user logged in and browsing while suspension happens
        console.log("Accused user staying logged in...");
        await accusedPage.goto("/");
        await accusedPage.waitForLoadState("networkidle");
        console.log("Accused user is browsing ✓");

        // Have three CMs vote to suspend the escalated report
        const suspensionVoters = ["E2E_CM_VSU_V1", "E2E_CM_VSU_V2", "E2E_CM_VSU_V3"];

        for (const voter of suspensionVoters) {
            console.log(`${voter} voting to suspend escaper...`);
            const { seededCMPage: voterPage } = await setupSeededCM(browser, voter);

            // Navigate directly to the report using the captured report number
            await navigateToReport(voterPage, reportNumber);

            await voterPage.click('input[value="suspend_user"]');

            const suspendVoteButton = await expectOGSClickableByName(voterPage, /Vote/);
            await suspendVoteButton.click();
            await voterPage.waitForLoadState("networkidle");

            console.log(`${voter} voted to suspend`);
            await voterPage.close();
        }

        // Wait for suspension processing
        console.log("Waiting for suspension processing...");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Verify suspended user sees human-readable ban reason
        console.log("=== Verifying suspended user sees human-readable ban reason ===");

        // Navigate to home page - should see a banner with appeal link
        await accusedPage.goto("/");
        await accusedPage.waitForLoadState("networkidle");

        // Should see a banner with "appeal here" link
        const appealLink = accusedPage.getByRole("link", { name: /appeal here/i });
        await expect(appealLink).toBeVisible();
        console.log("Appeal banner visible with 'appeal here' link ✓");

        // Click the appeal link to navigate to appeal page
        await appealLink.click();
        await accusedPage.waitForLoadState("networkidle");

        // Should now be on the appeal page
        await expect(accusedPage).toHaveURL(/\/appeal/);
        console.log("Navigated to appeal page via banner link ✓");

        // Verify suspension message is visible
        await expect(accusedPage.getByText(/suspended/i)).toBeVisible();
        console.log("Suspension message visible ✓");

        // Verify human-readable ban reason is shown in the "Reason for suspension:" heading
        // The Appeal page shows: "Reason for suspension: {{reason}}"
        const reasonHeading = accusedPage.locator("h2", {
            hasText: /Reason for suspension:/i,
        });
        await expect(reasonHeading).toBeVisible();

        // Check that the heading contains the full sentence with human-readable report type
        await expect(reasonHeading).toContainText(
            "Community moderation vote for suspension based on Stopped Playing reports",
        );

        // Verify the ugly code-style version "escaping" is NOT shown
        const reasonText = await reasonHeading.textContent();
        expect(reasonText).not.toContain("escaping");

        console.log("Human-readable ban reason displayed to user ✓");

        // After suspension, the reporter's count should return to initial
        // (Note: In this case, the accused gets suspended, which clears all reports about them)
        await tracker.assertCountReturnedToInitial(reporterPage);
    });

    await accusedPage.close();
    await opponentPage.close();

    console.log("=== CM Vote Suspend User Test Complete ===");
    console.log("✓ CMs can vote to suspend users");
    console.log("✓ Ban reason displays human-readable report type");
};
