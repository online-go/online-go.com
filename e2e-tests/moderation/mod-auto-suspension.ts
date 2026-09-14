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

/** Register with a suspended account's historical browser ID, then verify first-game suspension. */

import type { CreateContextOptions } from "@helpers";

import { randomUUID } from "node:crypto";
import { actAndWaitForResponse } from "@helpers/requests";
import { BrowserContext, expect } from "@playwright/test";
import {
    generateUniqueTestIPv6,
    newTestUsername,
    prepareNewUser,
    loginAsUser,
    banUserAsModerator,
} from "../helpers/user-utils";
import { expectOGSClickableByName } from "../helpers/matchers";
import {
    createDirectChallenge,
    acceptDirectChallenge,
    defaultChallengeSettings,
} from "../helpers/challenge-utils";
import { playMoves, resignActiveGame } from "../helpers/game-utils";
import { log } from "@helpers/logger";

export const autoSuspensionTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== Browser ID Suspension Test ===");
    const suspendedUserBID = randomUUID();
    const previousUsername = newTestUsername("BISPrevious");
    const previous = await prepareNewUser(
        createContext,
        previousUsername,
        "test",
        suspendedUserBID,
    );
    await previous.userPage.close();
    // Retain a historical BID while moving the current BID, as registration checks the latter.
    const csrf = (await previous.userContext.cookies()).find(
        (cookie) => cookie.name === "csrftoken",
    );
    expect(csrf).toBeDefined();
    const moved = await previous.userContext.request.post("/api/v0/login", {
        headers: { "X-CSRFToken": csrf!.value },
        data: { username: previousUsername, password: "test", ebi: randomUUID(), timezone: "UTC" },
    });
    expect(moved.ok(), `Move fixture browser ID: HTTP ${moved.status()}`).toBe(true);
    await previous.userContext.close();
    await banUserAsModerator(createContext, previousUsername, "E2E historical browser-ID fixture");

    // Create a new browser context with a unique IP
    const newIPv6 = generateUniqueTestIPv6();
    const testContext = await createContext({
        extraHTTPHeaders: {
            "X-Forwarded-For": newIPv6,
        },
    });
    const testPage = await testContext.newPage();
    log(`Created new context with IP ${newIPv6} ✓`);

    await testContext.addInitScript((bid) => {
        localStorage.setItem("ogs.device.uuid", JSON.stringify(bid));
    }, suspendedUserBID);

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
    log("Attempting to register new user with flagged BID...");
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
    await actAndWaitForResponse(testPage, { method: "POST", path: "/api/v0/register" }, () =>
        registerSubmitButton.click(),
    );
    await testPage.waitForURL((url) => url.pathname === "/", { waitUntil: "load" });

    // Wait for registration to complete - register button should disappear
    await expect(registerSubmitButton).toBeHidden();

    // Wait for successful registration by checking for Welcome message
    await expect(testPage.getByText("Welcome!")).toBeVisible();
    const userDropdown = testPage.locator(".username").getByText(newUsername);
    await expect(userDropdown).toBeVisible();
    log(`Registration successful for ${newUsername} with flagged BID ✓`);

    // Choose board style preference to complete onboarding
    // Wait for board style selection to be ready
    const chooseButton = await expectOGSClickableByName(testPage, /^Basic/);
    await chooseButton.click();
    await expect(testPage).toHaveURL(/\/(overview|$)/);

    // Turn off dynamic help
    await testPage.goto("/settings/help");
    const switchElement = testPage.locator(
        'div.PreferenceLine:has-text("Show dynamic help") input[role="switch"]',
    );
    const parentElement = testPage.locator('div.PreferenceLine:has-text("Show dynamic help")');
    // Wait for settings page to load by checking for the element
    await expect(parentElement).toBeVisible();
    const isSwitchOn = await switchElement.evaluate((el) => (el as HTMLInputElement).checked);
    if (isSwitchOn) {
        await parentElement.click();
    }

    await testPage.goto("/");

    // Create an opponent to play against
    log("Creating opponent user...");
    const opponentUsername = newTestUsername("BISOpp");
    const { userPage: opponentPage } = await prepareNewUser(
        createContext,
        opponentUsername,
        "test",
    );

    // Have the new user play a game
    log("New user creating a game challenge...");
    await createDirectChallenge(testPage, opponentUsername, {
        ...defaultChallengeSettings,
        ranked: false,
        gameName: "E2E Browser ID Suspension Test Game",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "300",
        timePerPeriod: "30",
        periods: "5",
    });

    log("Opponent accepting challenge...");
    await acceptDirectChallenge(opponentPage, testPage);

    // Wait for the Goban to be visible
    const goban = testPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    // Verify it's the new user's turn
    const newUserMove = testPage.getByText("Your move", { exact: true });
    await expect(newUserMove).toBeVisible();

    // Play a few moves
    log("Playing game...");
    const moves = ["D9", "E9", "D8", "E8", "D7", "E7", "D6", "E6"];
    await playMoves(testPage, opponentPage, moves, "9x9");

    // First-game suspension reloads this account; finish through the unaffected opponent.
    await testPage.close();
    await resignActiveGame(opponentPage);
    await expect
        .poll(
            async () => {
                const response = await testContext.request.get("/api/v1/ui/config");
                await expect(response).toBeOK();
                const config: { banned?: { banned_user_id: number } } = await response.json();
                return config.banned?.banned_user_id;
            },
            { timeout: 30000 },
        )
        .toBeTruthy();
    const suspendedPage = await testContext.newPage();
    await suspendedPage.goto("/");
    await expect(suspendedPage.getByRole("link", { name: /appeal here/i })).toBeVisible();

    // Verify the user appears in the Recently Blocked page
    log("Verifying user appears in Recently Blocked page...");
    const moderatorPassword = process.env.E2E_MODERATOR_PASSWORD;
    if (!moderatorPassword) {
        throw new Error("E2E_MODERATOR_PASSWORD environment variable must be set");
    }

    const modContext = await createContext();
    const modPage = await modContext.newPage();
    await loginAsUser(modPage, "E2E_MODERATOR", moderatorPassword);
    log("Logged in as moderator ✓");

    // Navigate to Recently Blocked page
    await modPage.goto("/moderator/recently-blocked");
    // Wait for the table to be visible (use table selector to avoid strict mode violation)
    await expect(modPage.locator("table.recently-blocked")).toBeVisible();
    log("Navigated to Recently Blocked page ✓");

    // Verify the suspended user appears in the table
    const userInTable = modPage.locator("table.recently-blocked").getByText(newUsername);
    await expect(userInTable).toBeVisible({ timeout: 10000 });
    log(`Found ${newUsername} in Recently Blocked table ✓`);

    // Verify the matched accounts dropdown is present
    const matchedAccountsCell = modPage
        .locator("table.recently-blocked tr")
        .filter({ hasText: newUsername })
        .locator(".matched-accounts");
    await expect(matchedAccountsCell).toBeVisible();

    // Verify it shows account count
    await expect(matchedAccountsCell).toContainText(/\d+ accounts?/);
    log("Verified matched accounts count is displayed ✓");

    // Click to expand the matched accounts dropdown
    const caret = matchedAccountsCell.locator("i.fa-caret-right");
    await expect(caret).toBeVisible();
    await matchedAccountsCell.click();
    log("Expanded matched accounts dropdown ✓");

    // Verify it now shows the down caret (expanded state)
    const caretDown = matchedAccountsCell.locator("i.fa-caret-down");
    await expect(caretDown).toBeVisible();

    // Verify the historical account appears in the dropdown.
    await expect(matchedAccountsCell.getByText(previousUsername)).toBeVisible();

    log("Recently Blocked page verification complete ✓");

    await modContext.close();
};
