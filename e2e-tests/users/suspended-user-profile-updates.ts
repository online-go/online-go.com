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

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, expect, Page } from "@playwright/test";
import {
    prepareNewUser,
    newTestUsername,
    banUserAsModerator as suspendUserAsModerator,
} from "../helpers/user-utils";
import { log } from "@helpers/logger";
import { actAndWaitForResponse } from "@helpers/requests";

/** Observe the initial fetch across a full navigation (30s) and data load (15s). */
const gotoAccountSettings = async (page: Page) => {
    const [response] = await Promise.all([
        page.waitForResponse(
            (response) =>
                new URL(response.url()).pathname === "/api/v1/me/account_settings" &&
                response.request().method() === "GET",
            { timeout: 45000 },
        ),
        page.goto("/settings/account"),
    ]);
    expect(response.ok()).toBe(true);
    expect(await response.finished()).toBeNull();
};

async function saveUsername(page: Page, proposed: string, persisted: string) {
    const input = page.locator('dt:has-text("Username") + dd input');
    const save = page.getByRole("button", { name: /^Save changes$/ });
    // Save is disabled while the initial account-settings request is being applied.
    await expect(async () => {
        await input.fill(proposed);
        await expect(save).toBeEnabled();
        await expect(input).toHaveValue(proposed);
    }).toPass({ timeout: 15000 });
    const normalSave = proposed === persisted;
    const refreshed = page.waitForResponse(
        (response) =>
            response.request().method() === "GET" &&
            new URL(response.url()).pathname === "/api/v1/ui/config",
    );
    const reloaded = normalSave
        ? page.waitForEvent("framenavigated", {
              predicate: (frame) => frame === page.mainFrame(),
          })
        : Promise.resolve();
    const [config] = await Promise.all([
        refreshed,
        reloaded,
        actAndWaitForResponse(page, { method: "PUT", path: /^\/api\/v1\/players\/\d+$/ }, () =>
            save.click(),
        ),
    ]);
    expect(config.ok()).toBe(true);
    expect(await config.finished()).toBeNull();
    if (!normalSave) {
        // Suspended config refreshes return before the normal reload callback.
        const state: { banned?: object } = await config.json();
        expect(state.banned).toBeDefined();
        await gotoAccountSettings(page);
    }
    await expect(input).toHaveValue(persisted);
    await expect(page.locator("span.username")).toHaveText(persisted);
}

export const suspendedUserCannotUpdateProfileTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== Suspended User Cannot Update Profile Test ===");

    // Create a new user
    log("Creating test user...");
    const username = newTestUsername("sUCPTTestUser"); // cspell:ignore sUCPT
    const { userPage } = await prepareNewUser(createContext, username, "test");

    // Navigate to account settings page to get initial username
    log("Getting initial username...");
    await gotoAccountSettings(userPage);

    // The username input is the first input in the settings page (after the Username label)
    const usernameInput = userPage.locator('dt:has-text("Username") + dd input');
    await expect(usernameInput).toBeVisible({ timeout: 15000 });
    await expect(usernameInput).toHaveValue(username);
    const initialUsername = username;

    log(`Initial username: ${initialUsername}`);

    // Suspend the user
    log(`Suspending user ${username}...`);
    // Suspension reloads connected browsers; retain the session without a live page.
    await userPage.goto("about:blank");
    await suspendUserAsModerator(
        createContext,
        username,
        "E2E test: Testing suspended user profile restrictions",
    );
    log("User suspended ✓");

    // Try to update username while suspended
    log("Attempting to update username while suspended...");
    await gotoAccountSettings(userPage);
    await expect(usernameInput).toBeVisible({ timeout: 15000 });
    await expect(usernameInput).toHaveValue(initialUsername);
    const newUsername = newTestUsername("HackedUsername");
    await saveUsername(userPage, newUsername, initialUsername);

    log("=== Suspended User Cannot Update Profile Test Complete ===");
    log("✓ Suspended users cannot update their username");
    log("✓ Updates are silently ignored without errors");
};

export const normalUserCanUpdateProfileTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== Normal User Can Update Profile Test ===");

    // Create a new user
    log("Creating test user...");
    const username = newTestUsername("NormalTest");
    const { userPage } = await prepareNewUser(createContext, username, "test");

    // Navigate to account settings page to get initial username
    log("Getting initial username...");
    await gotoAccountSettings(userPage);

    // The username input is the first input in the settings page (after the Username label)
    const usernameInput = userPage.locator('dt:has-text("Username") + dd input');
    await expect(usernameInput).toBeVisible({ timeout: 15000 });
    await expect(usernameInput).toHaveValue(username);
    const initialUsername = username;

    log(`Initial username: ${initialUsername}`);

    // Try to update username (should succeed for normal user)
    log("Attempting to update username...");
    const newUsername = newTestUsername("ChangedUsername");
    await saveUsername(userPage, newUsername, newUsername);

    log("=== Normal User Can Update Profile Test Complete ===");
    log("✓ Normal users can update their username");
};
