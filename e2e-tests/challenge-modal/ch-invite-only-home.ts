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

// (No seeded data in use)

// This test verifies that invite-only challenges appear on the user's home page
// with the correct details, including whether analysis is enabled or disabled.
//
// The server allows one outstanding live open challenge per player, so each
// invite is deleted from the home page before the next one is created.

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, Page, expect } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";

import { createInviteOnlyChallenge } from "@helpers/challenge-utils";

import { actAndWaitForResponse } from "@helpers/requests";

import { log } from "@helpers/logger";

// Deletes the single open invite shown on the home page and waits for the
// "Your Open Invites" section to go away.
// (FabX component has class "fab reject raiser")
const deleteOnlyOpenInvite = async (userPage: Page) => {
    const deleteButtons = userPage.locator(".InviteList .Card .fab.reject");
    await expect(deleteButtons).toHaveCount(1);
    await actAndWaitForResponse(
        userPage,
        { method: "DELETE", path: /^\/api\/v1\/challenges\/\d+$/ },
        () => deleteButtons.first().click(),
    );
    await expect(userPage.getByText("Your Open Invites")).not.toBeVisible({ timeout: 5000 });
};

export const chInviteOnlyHomeTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== Invite-Only Challenge Home Page Test ===");

    log("Creating test user...");
    const { userPage } = await prepareNewUser(
        createContext,
        newTestUsername("ChInvHome"), // cspell:disable-line
        "test",
    );
    log("Test user created");

    // Test 1: Create invite-only challenge WITH analysis enabled (default)
    log("Creating invite-only challenge with analysis ENABLED...");
    await createInviteOnlyChallenge(userPage, {
        gameName: "E2E Invite Analysis On",
        boardSize: "9x9",
        speed: "blitz",
        timeControl: "byoyomi",
        mainTime: "2",
        timePerPeriod: "2",
        periods: "1",
        disable_analysis: false,
    });
    log("Challenge with analysis enabled created");

    // Navigate to home page to verify the challenge appears
    log("Navigating to home page...");
    await userPage.goto("/");

    // Check for the "Your Open Invites" section
    log("Checking for 'Your Open Invites' section...");
    await expect(userPage.getByText("Your Open Invites")).toBeVisible({ timeout: 10000 });
    log("'Your Open Invites' section visible");

    // Verify the challenge name appears
    log("Verifying challenge 'E2E Invite Analysis On' appears...");
    await expect(userPage.getByText("E2E Invite Analysis On")).toBeVisible();
    log("Challenge name visible");

    // Verify "analysis disabled" does NOT appear for this challenge
    // (analysis is enabled, so no special text should appear)
    log("Verifying 'analysis disabled' does NOT appear for analysis-enabled challenge...");
    const challengeCard = userPage.locator(".InviteList .Card").filter({
        hasText: "E2E Invite Analysis On",
    });
    await expect(challengeCard).toBeVisible();
    await expect(challengeCard).not.toContainText("analysis disabled");
    log("Confirmed: 'analysis disabled' not shown for analysis-enabled challenge");

    // The server allows one live open challenge at a time, so delete this one
    // before creating the next
    log("Deleting the analysis-enabled challenge...");
    await deleteOnlyOpenInvite(userPage);
    log("Analysis-enabled challenge deleted");

    // Test 2: Create invite-only challenge WITH analysis disabled
    log("Creating invite-only challenge with analysis DISABLED...");
    await createInviteOnlyChallenge(userPage, {
        gameName: "E2E Invite Analysis Off",
        boardSize: "9x9",
        speed: "blitz",
        timeControl: "byoyomi",
        mainTime: "2",
        timePerPeriod: "2",
        periods: "1",
        disable_analysis: true,
    });
    log("Challenge with analysis disabled created");

    // Navigate to home page to verify the challenge appears
    log("Navigating to home page...");
    await userPage.goto("/");

    // Verify the second challenge name appears
    log("Verifying challenge 'E2E Invite Analysis Off' appears...");
    await expect(userPage.getByText("Your Open Invites")).toBeVisible({ timeout: 10000 });
    await expect(userPage.getByText("E2E Invite Analysis Off")).toBeVisible();
    log("Challenge name visible");

    // Verify "analysis disabled" DOES appear for this challenge
    log("Verifying 'analysis disabled' DOES appear for analysis-disabled challenge...");
    const challengeCardDisabled = userPage.locator(".InviteList .Card").filter({
        hasText: "E2E Invite Analysis Off",
    });
    await expect(challengeCardDisabled).toBeVisible();
    await expect(challengeCardDisabled).toContainText("analysis disabled");
    log("Confirmed: 'analysis disabled' shown for analysis-disabled challenge");

    // Clean up: delete the remaining challenge
    log("Cleaning up: deleting the analysis-disabled challenge...");
    await deleteOnlyOpenInvite(userPage);
    log("All challenges deleted");

    log("=== Test completed successfully ===");
};
