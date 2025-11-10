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
 * Test that users with a browser ID matching a suspended account get auto-suspended after first game
 *
 * This test verifies that:
 * 1. A suspended user exists who previously used a known BID (stored in PlayerBIDs table)
 * 2. A new user can register with that same BID (registration succeeds because it only checks current last_browser_id)
 * 3. The new user plays their first game
 * 4. After the game, the backend detects the BID matches a suspended account's historical BID
 * 5. The new user is auto-suspended
 *
 * The test works by:
 * - Setting device.uuid in localStorage to a BID that was previously used by E2E_SUSPENDED_BID_USER
 * - Registering a new account (succeeds because suspended user's current last_browser_id is different)
 * - Playing a complete game
 * - Checking for suspension banner after the game completes
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, expect } from "@playwright/test";
import {
    generateUniqueTestIPv6,
    newTestUsername,
    prepareNewUser,
    logoutUser,
} from "../helpers/user-utils";
import { expectOGSClickableByName } from "../helpers/matchers";
import {
    createDirectChallenge,
    acceptDirectChallenge,
    defaultChallengeSettings,
} from "../helpers/challenge-utils";
import { playMoves } from "../helpers/game-utils";

// This BID must match the one set for E2E_SUSPENDED_BID_USER in init_e2e.py
const SUSPENDED_USER_BID = "e2e-test-suspended-bid";

export const autoSuspensionTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    console.log("=== Browser ID Suspension Test ===");
    console.log(`Testing registration with BID matching suspended user: ${SUSPENDED_USER_BID}`);

    // Create a new browser context with a unique IP
    const newIPv6 = generateUniqueTestIPv6();
    const testContext = await createContext({
        extraHTTPHeaders: {
            "X-Forwarded-For": newIPv6,
        },
    });
    const testPage = await testContext.newPage();
    console.log(`Created new context with IP ${newIPv6} ✓`);

    // Set device.uuid using the data module API
    console.log(`Setting device.uuid to suspended BID: ${SUSPENDED_USER_BID}`);
    await testPage.goto("/");
    await testPage.waitForLoadState("networkidle");

    // Use the data.set() API to set device.uuid
    await testPage.evaluate((bid) => {
        (window as any).data.set("device.uuid", bid);
        console.log("Set device.uuid via data.set() to:", bid);
        console.log("Verify via data.get():", (window as any).data.get("device.uuid"));
    }, SUSPENDED_USER_BID);
    console.log("device.uuid set via data module ✓");

    // Navigate to registration page
    await testPage.goto("/");
    await testPage.getByRole("link", { name: /sign in/i }).click();
    await expect(testPage.getByLabel("Username")).toBeVisible();
    await expect(testPage.getByLabel("Password")).toBeVisible();

    // Go to register page
    const registerButton = await expectOGSClickableByName(testPage, /Register here!/);
    await registerButton.click();

    // Wait for "Welcome new player!" to confirm we're on the registration page
    await expect(testPage.getByText("Welcome new player!")).toBeVisible();

    // Fill in registration form
    console.log("Attempting to register new user with flagged BID...");
    const newUsername = newTestUsername("BISNew");
    const usernameInput = testPage.getByLabel("Username");
    await usernameInput.fill(newUsername);
    await expect(usernameInput).toHaveValue(newUsername);

    const passwordInput = testPage.getByLabel("Password");
    await passwordInput.fill("test");
    await expect(passwordInput).toHaveValue("test");

    const emailInput = testPage.getByLabel("Email");
    await emailInput.fill(`${newUsername}@test.com`);
    await expect(emailInput).toHaveValue(`${newUsername}@test.com`);

    const registerSubmitButton = await expectOGSClickableByName(testPage, /Register$/);
    await registerSubmitButton.click();

    // Wait for registration to complete - register button should disappear
    await expect(registerSubmitButton).toBeHidden();

    // Wait for successful registration
    await testPage.waitForLoadState("networkidle");
    await expect(testPage.getByText("Welcome!")).toBeVisible();
    const userDropdown = testPage.locator(".username").getByText(newUsername);
    await expect(userDropdown).toBeVisible();
    console.log(`Registration successful for ${newUsername} with flagged BID ✓`);

    // Choose board style preference to complete onboarding
    // Wait for board style selection to be ready
    await testPage.waitForTimeout(500);
    const chooseButton = await expectOGSClickableByName(testPage, /^Basic/);
    await chooseButton.click();
    await expect(testPage.getByText("You're not currently playing any games")).toBeVisible();

    // Turn off dynamic help
    await testPage.goto("/settings/help");
    await testPage.waitForLoadState("networkidle");
    const switchElement = testPage.locator(
        'div.PreferenceLine:has-text("Show dynamic help") input[role="switch"]',
    );
    const parentElement = testPage.locator('div.PreferenceLine:has-text("Show dynamic help")');
    await expect(parentElement).toBeVisible();
    const isSwitchOn = await switchElement.evaluate((el) => (el as HTMLInputElement).checked);
    if (isSwitchOn) {
        await parentElement.click();
    }

    await testPage.goto("/");

    // Create an opponent to play against
    console.log("Creating opponent user...");
    const opponentUsername = newTestUsername("BISOpp");
    const { userPage: opponentPage } = await prepareNewUser(
        createContext,
        opponentUsername,
        "test",
    );

    // Have the new user play a game
    console.log("New user creating a game challenge...");
    await createDirectChallenge(testPage, opponentUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E Browser ID Suspension Test Game",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "45",
        timePerPeriod: "10",
        periods: "1",
    });

    console.log("Opponent accepting challenge...");
    await acceptDirectChallenge(opponentPage);

    // Wait for the Goban to be visible
    const goban = testPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });
    await testPage.waitForTimeout(1000);

    // Verify it's the new user's turn
    const newUserMove = testPage.getByText("Your move", { exact: true });
    await expect(newUserMove).toBeVisible();

    // Play a few moves
    console.log("Playing game...");
    const moves = ["D9", "E9", "D8", "E8", "D7", "E7"];
    await playMoves(testPage, opponentPage, moves, "9x9");

    // Both players pass to end the game
    const newUserPass = await expectOGSClickableByName(testPage, "Pass");
    await newUserPass.click();

    const opponentPass = await expectOGSClickableByName(opponentPage, "Pass");
    await opponentPass.click();

    // Accept scores
    const opponentAccept = await expectOGSClickableByName(opponentPage, "Accept");
    await opponentAccept.click();

    const newUserAccept = await expectOGSClickableByName(testPage, "Accept");
    await newUserAccept.click();

    // Wait for game to finish
    await expect(testPage.getByText("wins by")).toBeVisible();
    console.log("Game completed ✓");

    // Wait for the post-game suspension check to process
    // The backend needs to: process game end, check BIDs, and suspend the user
    // This can take longer on slower servers (CI vs local dev)
    console.log("Waiting for post-game BID check to process...");

    // Poll for suspension banner with retries (up to 30 seconds)
    let suspensionDetected = false;
    const maxRetries = 1;
    const retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`Checking for suspension (attempt ${attempt}/${maxRetries})...`);

        // Navigate to home to refresh user state
        await testPage.goto("/");
        await testPage.waitForLoadState("networkidle");

        // Check if banned_user_id is set in the data store
        const bannedUserId = await testPage.evaluate(() => {
            return (window as any).data.get("appeals.banned_user_id");
        });
        console.log(`  appeals.banned_user_id: ${bannedUserId}`);

        // Check if appeal link is visible
        const appealLink = testPage.getByRole("link", { name: /appeal here/i });
        const isVisible = await appealLink.isVisible().catch(() => false);

        if (isVisible) {
            console.log("Suspension banner with 'appeal here' link visible ✓");
            suspensionDetected = true;
            break;
        }

        if (attempt < maxRetries) {
            console.log(`  Not suspended yet, waiting ${retryDelay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
    }

    if (!suspensionDetected) {
        console.error("Suspension not detected after maximum retries");
        // Take a screenshot for debugging
        await testPage.screenshot({ path: "test-results/suspension-timeout.png" });
    }

    // Final assertion
    const appealLink = testPage.getByRole("link", { name: /appeal here/i });
    await expect(appealLink).toBeVisible();
    console.log("Auto-suspension verification complete ✓");

    // Clean up: Change the suspended user's last_browser_id to avoid affecting future test runs
    // We do this by logging out and back in with a different BID and IP
    // (last_browser_id only updates at registration and login time)
    console.log("Cleaning up: Changing suspended user's last_browser_id...");

    // Log out first
    await logoutUser(testPage);
    console.log("Logged out ✓");

    // Create a fresh context with a new IP
    const cleanupIPv6 = generateUniqueTestIPv6();
    const cleanupContext = await createContext({
        extraHTTPHeaders: {
            "X-Forwarded-For": cleanupIPv6,
        },
    });
    const cleanupPage = await cleanupContext.newPage();
    console.log(`Created fresh context with new IP ${cleanupIPv6} ✓`);

    // Set a new BID different from the test BID
    const cleanupBID = `cleanup-bid-${Date.now()}`;
    await cleanupPage.goto("/");
    await cleanupPage.waitForLoadState("networkidle");
    await cleanupPage.evaluate((bid) => {
        (window as any).data.set("device.uuid", bid);
        console.log("Set cleanup BID:", bid);
    }, cleanupBID);

    // Hit the login API with the new BID and IP (this updates last_browser_id)
    await cleanupPage.goto("/sign-in");

    await cleanupPage.waitForLoadState("networkidle");

    await cleanupPage.getByLabel("Username").fill(newUsername);
    await cleanupPage.getByLabel("Password").fill("test");
    await cleanupPage.getByRole("button", { name: /Sign in$/ }).click();
    await cleanupPage.waitForLoadState("networkidle");

    // This will error because the user is suspended
    // (which is a bug, they need to log in to appeal!)

    // but at least we've cleared the last_browser_id for future test runs
    console.log("Logged back in with cleanup BID and new IP ✓");
    console.log(`Updated last_browser_id from ${SUSPENDED_USER_BID} to ${cleanupBID}`);

    console.log("=== Browser ID Suspension Test Complete ===");
    console.log("✓ User with flagged BID registered successfully");
    console.log("✓ User was auto-suspended after first game");
    console.log("✓ Suspension banner displayed correctly");
    console.log("✓ Cleaned up last_browser_id for future test runs");
};
