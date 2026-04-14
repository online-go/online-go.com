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
 * Test Appeal Template Selector with AI Use suspension
 *
 * This test verifies that:
 * 1. Two users play a game, one reports the other for AI use
 * 2. An AI Detector CM votes to suspend the reported user
 * 3. The suspended user submits an appeal
 * 4. A moderator navigates to the appeal via the Appeals Center
 * 5. The template selector dropdown is visible to the moderator
 * 6. AI-use-specific templates appear in the dropdown
 * 7. Selecting a template populates the textarea with the template text
 *
 * Uses seeded users:
 * - E2E_AI_DETECTOR: AI Detector with AI_DETECTOR moderator powers
 * - E2E_MODERATOR: Full moderator
 *
 * Requires environment variables:
 * - E2E_MODERATOR_PASSWORD: Password for both E2E_MODERATOR and E2E_AI_DETECTOR
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
    reportPlayerByColor,
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

export const appealTemplateSelectorTest = async (
    {
        createContext,
    }: {
        createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
    },
    testInfo: any,
) => {
    return withIncidentIndicatorLock(testInfo, async () => {
        log("=== Appeal Template Selector Test ===");

        const password = process.env.E2E_MODERATOR_PASSWORD;
        if (!password) {
            throw new Error(
                "E2E_MODERATOR_PASSWORD environment variable must be set to run this test",
            );
        }

        // 1. Create two users who will play a game
        log("Creating reporter user...");
        const reporterUsername = newTestUsername("aTplReporter");
        const { userPage: reporterPage } = await prepareNewUser(
            createContext,
            reporterUsername,
            "test",
        );
        log(`Reporter user created: ${reporterUsername} ✓`);

        log("Creating reported user...");
        const reportedUsername = newTestUsername("aTplReported");
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
            gameName: "E2E Appeal Template Test Game",
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

        const goban = reporterPage.locator(".Goban[data-pointers-bound]");
        await goban.waitFor({ state: "visible" });

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

        const reportedAccept = reportedPage.getByText("Accept");
        await expect(reportedAccept).toBeVisible();
        await reportedAccept.click();

        const reporterAccept = reporterPage.getByText("Accept");
        await expect(reporterAccept).toBeVisible();
        await reporterAccept.click();

        const reporterFinished = reporterPage.getByText("wins by");
        await expect(reporterFinished).toBeVisible();
        log("Game finished ✓");

        // 3. Reporter reports the other player for AI use
        log(`Reporting ${reportedUsername} for AI use...`);
        await reportPlayerByColor(
            reporterPage,
            ".white",
            "ai_use",
            "E2E test - This player is using AI assistance",
        );
        log("AI use report submitted ✓");

        const reportNumber = await captureReportNumber(reporterPage);
        log(`Report number captured: ${reportNumber} ✓`);

        // 4. AI Detector votes to suspend
        log("Setting up E2E_AI_DETECTOR...");
        const aiDetectorContext = await createContext({
            extraHTTPHeaders: {
                "X-Forwarded-For": generateUniqueTestIPv6(),
            },
        });
        const aiDetectorPage = await aiDetectorContext.newPage();
        await loginAsUser(aiDetectorPage, "E2E_AI_DETECTOR", password);
        await turnOffDynamicHelp(aiDetectorPage);
        log("E2E_AI_DETECTOR logged in ✓");

        log(`AI Detector navigating to report ${reportNumber}...`);
        await navigateToReport(aiDetectorPage, reportNumber);

        await expect(aiDetectorPage.getByText("AI Use").first()).toBeVisible();
        log("Confirmed report type is AI Use ✓");

        const suspendRadio = aiDetectorPage.locator('input[value="suspend_ai_user"]');
        await suspendRadio.click();
        await expect(suspendRadio).toBeChecked();
        log("Selected suspend action ✓");

        const voteButton = await expectOGSClickableByName(aiDetectorPage, /^Vote$/);
        await voteButton.click();
        log("Vote submitted ✓");

        // Wait for vote to be processed - check that Vote button is disabled or hidden
        await expect(voteButton)
            .toBeDisabled({ timeout: 5000 })
            .catch(() => {
                // Button might be hidden instead of disabled
            });

        // Wait for the reporter to receive the suspension notification via websocket push.
        // This confirms the suspension has been fully processed before we check the
        // suspended user's page.
        log("Waiting for reporter to receive suspension notification...");
        await expect(reporterPage.getByText(/has been suspended/)).toBeVisible({ timeout: 30000 });
        log("Reporter received suspension notification ✓");

        // Dismiss the notification dialog
        await reporterPage.getByRole("button", { name: "OK" }).click();

        // 5. Suspended user submits an appeal
        log("Suspended user navigating to appeal page...");
        await reportedPage.goto("/");
        await expect(reportedPage.getByText("Your account has been suspended")).toBeVisible();
        log("Suspension banner visible ✓");

        const appealLink = reportedPage.getByRole("link", { name: /appeal here/i });
        await expect(appealLink).toBeVisible();
        await appealLink.click();

        await expect(reportedPage.getByText(/Your account has been suspended/i)).toBeVisible();
        log("Appeal page loaded ✓");

        const appealTextarea = reportedPage.locator(".input-card textarea");
        await expect(appealTextarea).toBeVisible();
        await appealTextarea.fill("I did not use AI. Please review my case.");
        await expect(appealTextarea).toHaveValue("I did not use AI. Please review my case.");

        const userSubmitButton = await expectOGSClickableByName(reportedPage, /^Submit$/);
        await userSubmitButton.click();
        await expect(userSubmitButton).toBeDisabled();
        log("Appeal submitted ✓");

        await expect(
            reportedPage.getByText(/I did not use AI. Please review my case./i),
        ).toBeVisible({ timeout: 10000 });
        log("Appeal message visible ✓");

        // 6. Moderator navigates to the appeal via Appeals Center
        log("Setting up moderator...");
        const modContext = await createContext({
            extraHTTPHeaders: {
                "X-Forwarded-For": generateUniqueTestIPv6(),
            },
        });
        const modPage = await modContext.newPage();
        await loginAsUser(modPage, "E2E_MODERATOR", password);
        await turnOffDynamicHelp(modPage);
        log("Moderator logged in ✓");

        log("Moderator navigating to Appeals Center...");
        await modPage.goto("/appeals-center");
        await expect(modPage.getByRole("heading", { name: /Appeals Center/i })).toBeVisible();
        log("Appeals Center loaded ✓");

        // Find the appeal row for the reported user
        log(`Looking for appeal from ${reportedUsername}...`);
        const appealRow = modPage.locator(".PaginatedTable tr", { hasText: reportedUsername });
        await expect(appealRow).toBeVisible();

        // Verify the reason column shows AI-related text
        const reasonCell = appealRow.locator("td.ban_reason");
        await expect(reasonCell).toContainText("AI");
        log("AI ban reason visible in appeals table ✓");

        // Click on the state cell to open the appeal
        const stateCell = appealRow.locator("td.state").last();
        await stateCell.click();

        // Verify the appeal detail page loaded with the user's message
        await expect(modPage.getByText(/I did not use AI/i)).toBeVisible();
        log("Appeal detail page loaded ✓");

        // 7. Verify the template selector is visible
        log("Checking template selector...");
        const templateSelector = modPage.locator(".TemplateSelector select");
        await expect(templateSelector).toBeVisible();
        log("Template selector visible ✓");

        // 8. Verify AI-use-specific templates appear in the dropdown
        // Check that AI use acknowledgment templates are present (these only appear for AI use offenses)
        const aiAckOption = templateSelector.locator("option", {
            hasText: /AI use appeal process/,
        });
        await expect(aiAckOption.first()).toBeAttached();
        log("AI-use-specific acknowledgment template found ✓");

        const aiDenialOption = templateSelector.locator("option", {
            hasText: /Appeal denied.*AI use/,
        });
        await expect(aiDenialOption).toBeAttached();
        log("AI-use-specific denial template found ✓");

        const aiWelcomeOption = templateSelector.locator("option", {
            hasText: /Welcome back.*AI use/,
        });
        await expect(aiWelcomeOption).toBeAttached();
        log("AI-use-specific welcome back template found ✓");

        // Verify general templates are also present
        const generalAckOption = templateSelector.locator("option", {
            hasText: /Thanks for appealing/,
        });
        await expect(generalAckOption).toBeAttached();
        log("General acknowledgment template also present ✓");

        // 9. Select an AI use template and verify it populates the textarea
        log("Selecting AI use acknowledgment template...");
        const modTextarea = modPage.locator(".input-card textarea");
        await expect(modTextarea).toBeVisible();

        // Textarea should be empty initially
        await expect(modTextarea).toHaveValue("");

        // Select the AI use template (with prior warning) by its value (template id)
        await templateSelector.selectOption("ack_ai_use");

        // Verify the textarea is populated with template text containing a distinctive phrase
        await expect(modTextarea).toHaveValue(/double check and refresh your memory/);
        log("Template text populated in textarea ✓");

        // 10. Select a different template and confirm the replacement dialog
        log("Testing template replacement confirmation...");

        // Set up dialog handler to accept the confirmation
        modPage.on("dialog", (dialog) => dialog.accept());

        // Select the denial template by its value (template id)
        await templateSelector.selectOption("denial_ai_use");

        // Verify the textarea now has the denial text
        await expect(modTextarea).toHaveValue(/AI was definitely used/);
        log("Template replacement confirmed and applied ✓");

        log("=== Appeal Template Selector Test Complete ===");
        log("✓ AI Detector suspended user for AI use");
        log("✓ Suspended user submitted appeal");
        log("✓ Moderator found appeal in Appeals Center");
        log("✓ Template selector visible on appeal detail page");
        log("✓ AI-use-specific templates present in dropdown");
        log("✓ General templates also present");
        log("✓ Selecting template populates textarea");
        log("✓ Replacing template text shows confirmation");
    });
};
