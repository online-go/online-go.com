/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 */

import { expect } from "@playwright/test";
import { Page, BrowserContext } from "@playwright/test";

import { expectOGSClickableByName } from "./matchers";
import { load, CreateContextOptions } from "@helpers";
import { log } from "./logger";

/**
 * User Management Utilities for E2E Tests
 *
 * This file provides utility functions for managing users in end-to-end tests:
 *
 * User Creation & Registration:
 * - newTestUsername(): Generate unique test usernames with timestamp
 * - generateUniqueTestIPv6(): Generate unique IPv6 addresses for test users
 * - registerNewUser(): Register a new user account
 * - prepareNewUser(): Register and set up a new user with basic preferences
 *
 * Authentication & Session Management:
 * - loginAsUser(): Log in as an existing user
 * - logoutUser(): Log out the current user
 * - setupSeededUser(): Set up a pre-existing seeded user account
 * - setupSeededCM(): Set up a seeded Community Moderator account
 *
 * Profile & Navigation:
 * - goToProfile(): Navigate to the current user's profile page
 * - goToUsersProfile(): Navigate to another user's profile page
 * - goToUsersGame(): Navigate to a specific game for a user
 *
 * Player Interactions:
 * - openUserDropdownFromOmniSearch(): Open user's dropdown menu from via omnisearch
 *
 * Moderation & Reporting:
 * - reportUser(): Submit a user report with specified type and notes
 * - reportPlayerByColor(): Report a player by their game color
 * - assertIncidentReportIndicatorActive(): Verify incident report indicator is active
 * - assertIncidentReportIndicatorInactive(): Verify incident report indicator is inactive
 * - turnOffModerationQuota(): Disable moderation quota for CM accounts
 *
 * Notification Indicators:
 * - assertNotificationIndicatorActive(): Verify notification indicator is active with count
 * - assertNotificationIndicatorInactive(): Verify notification indicator is inactive
 *
 * UI Preferences:
 * - turnOffDynamicHelp(): Disable dynamic help popups
 *
 * Navigation:
 * - selectNavMenuItem(): Clicks a specified Nav Menu item & subitem
 */

// This is tweaked to provide us with lots of unique usernames but also
// a decent number of readable user-role characters, within the OGS username 30 character limit
// on registration.
export const newTestUsername = (user_role: string) => {
    if (user_role.length > 20) {
        throw new Error("user_role must be 20 characters or less");
    }
    const timestamp = Date.now().toString(36);
    // Using 5 chars provides uniqueness roughly every 1.3 seconds
    // This allows re-running tests with <10 second intervals
    const midChars = timestamp.slice(-7, -2);
    // Include worker index to prevent username collisions in parallel execution
    const workerIndex = process.env.TEST_WORKER_INDEX || "0";
    return `e2e${user_role}_${midChars}${workerIndex}`;
};

// Counter for same-millisecond IPv6 generation
let ipv6Counter = 0;

// Generate unique IPv6 addresses for test users using timestamp + counter + worker index
// Similar approach to newTestUsername - timestamp ensures uniqueness across test runs
// Worker index ensures uniqueness across parallel workers
export const generateUniqueTestIPv6 = (): string => {
    const timestamp = Date.now().toString(16); // Use hex (base-16) for valid IPv6
    const counter = (ipv6Counter++).toString(16).padStart(4, "0");
    const workerIndex = parseInt(process.env.TEST_WORKER_INDEX || "0", 10)
        .toString(16)
        .padStart(1, "0");

    // Use fd00::/8 private IPv6 range for testing
    // IPv6 segments must be 4 hex chars max, so split 8-char timestamp into two segments
    // Format: fd00:e2e:W::abcd:1234:0001 where W is worker, abcd:1234 is timestamp
    // Example: fd00:e2e:1::12ab:34cd:0001
    const timestampHex = timestamp.slice(-8).padStart(8, "0");
    const seg1 = timestampHex.slice(0, 4);
    const seg2 = timestampHex.slice(4, 8);
    return `fd00:e2e:${workerIndex}::${seg1}:${seg2}:${counter}`;
};

export const registerNewUser = async (
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>,
    username: string,
    password: string,
) => {
    const uniqueIPv6 = generateUniqueTestIPv6();
    const userContext = await createContext({
        extraHTTPHeaders: {
            "X-Forwarded-For": uniqueIPv6,
        },
    });
    const userPage = await userContext.newPage();
    await userPage.goto("/");
    // Go from "landing page" to the "Register" page.
    await userPage.getByRole("link", { name: /Register/i }).click();
    await expect(userPage.getByText("Welcome new player!")).toBeVisible();
    await expect(userPage.getByLabel("Username")).toBeVisible();
    await expect(userPage.getByLabel("Password")).toBeVisible();

    // Fill in registration form
    await userPage.getByLabel("Username").fill(username);
    await userPage.getByLabel("Password").fill(password);
    const registerButton = await expectOGSClickableByName(userPage, /Register$/);
    await registerButton.click();

    // Verify successful registration
    // Wait for "Welcome!" to appear after registration and page reload (30s timeout)
    // No networkidle wait needed - explicit UI state checks are more reliable
    await expect(userPage.getByText("Welcome!")).toBeVisible({ timeout: 30000 });

    const userDropdown = userPage.locator(".username").getByText(username);
    await expect(userDropdown).toBeVisible();

    return {
        userPage,
        userContext,
    };
};

export const prepareNewUser = async (
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>,
    username: string,
    password: string,
) => {
    const { userPage, userContext } = await registerNewUser(createContext, username, password);

    // Wait for the rank chooser component to be fully rendered after page load
    // This ensures React has finished initial rendering before we try to interact with buttons
    await expect(userPage.getByText("What is your Go skill level?")).toBeVisible({
        timeout: 10000,
    });

    // We need to choose _something_ to get rid of this on the Profile page:
    // typically, we don't want to see that.
    // (Quirky regex due to variable text on the button for A/B/C testing)
    const chooseButton = await expectOGSClickableByName(userPage, /^Basic/);
    await chooseButton.click();

    await expect(userPage.getByText("You're not currently playing any games")).toBeVisible();

    await turnOffDynamicHelp(userPage); // the popups can get in the way.

    // Prevent desktop notification prompts from appearing during tests
    await userPage.evaluate(() => {
        localStorage.setItem("ogs.preferences.asked-to-enable-desktop-notifications", "true");
    });

    await load(userPage, "/");

    return {
        userPage,
        userContext,
    };
};

export const goToProfile = async (userPage: Page) => {
    const menuLink = userPage.locator('nav[aria-label="Profile"] .Menu-title');
    await expect(menuLink).toBeVisible();
    await expect(menuLink).toBeEnabled();
    await menuLink.hover(); // Ensure the dropdown stays open
    await menuLink.click();

    const profileLink = userPage.getByRole("link", { name: "Profile", exact: true });
    await expect(profileLink).toBeVisible();
    await expect(profileLink).toBeEnabled();
    await profileLink.click();

    await expect(userPage.getByText("Ratings")).toBeVisible();
    await userPage.mouse.move(0, 0); // Move mouse away to ensure menu closes
};

export const logoutUser = async (page: Page) => {
    // Log out...
    const userDropdown = page.locator(".username").first();
    await userDropdown.click();

    const logoutButton = await expectOGSClickableByName(page, /Sign out$/);

    await logoutButton.click();

    // Logout causes the username to disappear
    await expect(page.locator(".username").first()).toBeHidden();
};

export const loginAsUser = async (page: Page, username: string, password: string) => {
    await page.goto("/sign-in");

    // Wait for sign-in form to be visible
    await expect(page.getByLabel("Username")).toBeVisible({ timeout: 10000 });

    const isUserLoggedIn = await page
        .locator('.username:has-text("${username}")')
        .isVisible({ timeout: 0 });
    if (isUserLoggedIn) {
        return; // We're already logged in.
    }

    // Actually log in
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /Sign in$/ }).click();

    // Wait for login to complete by checking for username in header (backend can be slow)
    await expect(page.locator(".username").getByText(username)).toBeVisible({ timeout: 30000 });

    // Save the authenticated state for Playwright
    await page.context().storageState({ path: "playwright/.auth/user.json" });
};

export const turnOffDynamicHelp = async (page: Page) => {
    await page.goto("/settings/help");

    // Wait for the preference line to be visible
    const parentElement = page.locator('div.PreferenceLine:has-text("Show dynamic help")');
    await expect(parentElement).toBeVisible({ timeout: 10000 });

    const switchElement = page.locator(
        'div.PreferenceLine:has-text("Show dynamic help") input[role="switch"]',
    );
    const isSwitchOn = await switchElement.evaluate((el) => (el as HTMLInputElement).checked);
    if (isSwitchOn) {
        await parentElement.click();
    }
};

// actually you could set up any user using this but its unusual to need to log in
// a newly registered user.

export const setupSeededUser = async (
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>,
    username: string,
) => {
    const uniqueIPv6 = generateUniqueTestIPv6();
    const userContext = await createContext({
        extraHTTPHeaders: {
            "X-Forwarded-For": uniqueIPv6,
        },
    });
    const userPage = await userContext.newPage();
    await loginAsUser(userPage, username, "test");
    await turnOffDynamicHelp(userPage); // the popups can get in the way.

    return {
        userPage,
        userContext,
    };
};

export const setupSeededCM = async (
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>,
    username: string,
) => {
    const uniqueIPv6 = generateUniqueTestIPv6();
    const seededCMContext = await createContext({
        extraHTTPHeaders: {
            "X-Forwarded-For": uniqueIPv6,
        },
    });
    const seededCMPage = await seededCMContext.newPage();
    await loginAsUser(seededCMPage, username, "test");
    await turnOffDynamicHelp(seededCMPage); // the popups can get in the way.

    await turnOffModerationQuota(seededCMPage); // need them to be able to keep voting!

    return {
        seededCMPage,
        seededCMContext,
    };
};

export const turnOffModerationQuota = async (page: Page) => {
    await page.goto("/settings/moderator");

    const preferenceLine = await page.locator(".PreferenceLine").filter({
        has: page.locator(".PreferenceLineTitle", { hasText: "Report quota" }),
    });

    await expect(preferenceLine).toBeVisible();
    const reportQuotaInput = preferenceLine.locator('.PreferenceLineBody input[type="number"]');

    await reportQuotaInput.fill("0");
};

export const openUserDropdownFromOmniSearch = async (page: Page, username: string) => {
    // Go to their profile where for sure there is their player link
    await goToUsersProfile(page, username);

    // Use first() to avoid strict mode violations when multiple Player links exist on profile
    const playerLink = page.locator(`a.Player:has-text("${username}")`).first();
    await expect(playerLink).toBeVisible();
    await playerLink.hover(); // Ensure the dropdown stays open
    await playerLink.click();
};

export const goToUsersProfile = async (page: Page, username: string) => {
    await page.fill(".OmniSearch-input", username);
    await page.waitForSelector(".results .result");
    await page.click(`.results .result:has-text('${username}')`);

    // It's actually tricky to prove we're on the profile page.  Appearance of this will have to do.
    // Use first() to avoid strict mode violations when multiple Player-username elements exist
    const playerUsername = page.locator(".Player-username").getByText(username).first();
    await expect(playerUsername).toBeVisible();
    return playerUsername;
};

// Note: if there are multiple matches, this grabs the first.   This is avoids issues if we
// accidentally have more seed games than intended.
export const goToUsersFinishedGame = async (page: Page, username: string, gameName: string) => {
    await goToUsersProfile(page, username);

    const gameHistory = page.getByText("Game History");
    await gameHistory.scrollIntoViewIfNeeded(); // assists debug
    await expect(gameHistory).toBeVisible();
    const target_game = page.getByText(gameName, { exact: true }).first();
    await expect(target_game).toBeVisible();

    // Go to that page ...
    await target_game.click();
    await expect(page.locator(".Game")).toBeVisible();
    // Wait for Goban to be fully ready for interactions (replaces flaky waitForTimeout)
    const gobanReady = page.locator(".Goban[data-pointers-bound]");
    await gobanReady.waitFor({ state: "visible" });
};

export const reportUser = async (page: Page, username: string, type: string, notes: string) => {
    const playerLink = page.locator(`a.Player:has-text("${username}")`);
    await expect(playerLink).toBeVisible();
    await playerLink.hover(); // Ensure the dropdown stays open
    await playerLink.click();

    // Wait for PlayerDetails popover to appear before looking for Report button
    await expect(page.locator(".PlayerDetails")).toBeVisible({ timeout: 15000 });

    await expect(page.getByRole("button", { name: /Report$/ })).toBeVisible();
    await page.getByRole("button", { name: /Report$/ }).click();

    await expect(page.getByText("Request Moderator Assistance")).toBeVisible();

    await page.selectOption(".type-picker select", { value: type });

    const notesBox = page.locator(".notes");
    await notesBox.fill(notes);

    const submitButton = await expectOGSClickableByName(page, /Report User$/);
    await submitButton.click();

    await expect(page.getByText("Thanks for the report!")).toBeVisible();
    const OK = await expectOGSClickableByName(page, "OK");
    // tidy up
    await OK.click();
    await expect(OK).toBeHidden();
};

/**
 * Capture the report number from the reporter's "My Own Reports" page.
 * Reports are displayed oldest first in the UI, so we take the last one to get the most recent.
 * Note: The displayed report number (e.g., "R092") may be truncated/wrapped from the actual ID (e.g., 1092),
 * so we cannot reliably sort by the displayed number. We rely on the UI's display order instead.
 * Returns the report number (e.g., "R123").
 */
export const captureReportNumber = async (reporterPage: Page): Promise<string> => {
    await reporterPage.goto("/reports-center");
    await expect(reporterPage.getByText("My Own Reports")).toBeVisible();
    await reporterPage.getByText("My Own Reports").click();

    // Wait for the reports to load - look for the incident container or report list
    // This ensures the click was processed and content loaded before looking for specific report
    await expect(
        reporterPage.locator(".incident, .report-item, .PaginatedTable").first(),
    ).toBeVisible({ timeout: 10000 });

    // The report number is in a button at the top left of the display area
    // Look for ALL patterns like "R123" in buttons or links
    const reportButtons = reporterPage.locator("button, a").filter({ hasText: /^R\d+$/ });
    await expect(reportButtons.first()).toBeVisible({ timeout: 30000 });

    // Get the count to verify we have reports
    const count = await reportButtons.count();
    if (count === 0) {
        throw new Error("No report numbers found in My Own Reports");
    }

    // Get the LAST report button (most recently created - reports are displayed oldest first)
    const reportNumber = await reportButtons.last().textContent();
    if (!reportNumber || !reportNumber.match(/^R\d+$/)) {
        throw new Error(`Failed to capture valid report number. Got: ${reportNumber}`);
    }

    log(`Captured report number: ${reportNumber} (from ${count} total reports)`);
    return reportNumber;
};

/**
 * Navigate directly to a specific report by its report number.
 * This works for any user who has permission to view the report.
 */
export const navigateToReport = async (page: Page, reportNumber: string) => {
    // Extract the numeric ID from the report number (e.g., "R123" -> "123")
    const reportId = reportNumber.replace(/^R/, "");

    // Use /reports-center/all/{id} format which works for all permission levels
    await page.goto(`/reports-center/all/${reportId}`);

    // Verify we're looking at the correct report by checking for the report number
    await expect(page.getByText(reportNumber, { exact: true })).toBeVisible({ timeout: 15000 });
    log(`Navigated to report ${reportNumber}`);
};

export const reportPlayerByColor = async (
    page: Page,
    color: string,
    type: string,
    notes: string,
) => {
    const playerLink = page.locator(`${color}.player-name-container a.Player`);
    await expect(playerLink).toBeVisible();
    await playerLink.hover(); // Ensure the dropdown stays open
    await playerLink.click();

    await expect(page.getByRole("button", { name: /Report$/ })).toBeVisible();
    await page.getByRole("button", { name: /Report$/ }).click();

    await expect(page.getByText("Request Moderator Assistance")).toBeVisible();

    await page.selectOption(".type-picker select", { value: type }); // cspell:disable-line

    const notesBox = page.locator(".notes");
    await notesBox.fill(notes);

    const submitButton = await expectOGSClickableByName(page, /Report User$/);
    await submitButton.click();

    await expect(page.getByText("Thanks for the report!")).toBeVisible();
    const OK = await expectOGSClickableByName(page, "OK");
    // tidy up
    await OK.click();
    await expect(OK).toBeHidden();
};

export const assertIncidentReportIndicatorActive = async (page: Page, count: number) => {
    const indicator = page.locator(".IncidentReportIndicator");
    const icon = indicator.locator(".fa-exclamation-triangle.active");
    const countDisplay = indicator.locator(".count.active");

    await expect(indicator).toBeVisible();
    await expect(icon).toBeVisible();
    await expect(countDisplay, "Unexpected number of reports open!").toHaveText(`${count}`);

    return indicator;
};

export const assertIncidentReportIndicatorInactive = async (page: Page) => {
    const indicator = page.locator(".IncidentReportIndicator");
    await expect(indicator).toBeEmpty();
};

export const assertNotificationIndicatorActive = async (page: Page, count: number) => {
    const indicator = page.locator(".NotificationIndicator");
    const icon = indicator.locator(".fa-bell.active");
    const countDisplay = indicator.locator(".count.active");

    await expect(indicator).toBeVisible();
    await expect(icon).toBeVisible();
    await expect(countDisplay).toHaveText(`${count}`);

    return indicator;
};

export const assertNotificationIndicatorInactive = async (page: Page) => {
    const indicator = page.locator(".NotificationIndicator");
    const icon = indicator.locator(".fa-bell");
    const countDisplay = indicator.locator(".count");

    await expect(indicator).toBeVisible();
    await expect(icon).toBeVisible();
    await expect(countDisplay).toHaveText("0");
};

// Currently this is expected to be used with a single notification.
// When we have more than one, extend this :)
// Could find the right notification by type, and handle a count parameter.
export const dismissNotification = async (page: Page) => {
    await assertNotificationIndicatorActive(page, 1);

    const notificationIndicator = page.locator(".NotificationIndicator");
    await notificationIndicator.click();

    const dismissButton = page.locator(".notification .fa-times-circle");
    await expect(dismissButton).toBeVisible();
    await dismissButton.click();
};

export const selectNavMenuItem = async (
    page: Page,
    menuItemAriaName: string, // we can use aria here because it as implemented already
    subMenuItemName: string, // ideally we'd use aria here, but it's not implemented yet
) => {
    // Find the menu item by its button's aria-label
    const menuItem = page
        .locator('nav[aria-label="Main Navigation"]')
        .locator(`li.Menu:has(button[aria-label="${menuItemAriaName}"])`);

    await expect(menuItem).toBeVisible();

    // Click the button to open the menu using force option
    const menuButton = menuItem.locator("button.OpenMenuButton");
    await menuButton.click({ force: true });

    // Find the subitem within this specific menu's children
    const subItemLink = menuItem
        .locator(".Menu-children")
        .locator(".MenuLink")
        .filter({ has: page.locator(".MenuLinkTitle", { hasText: subMenuItemName }) });
    await subItemLink.waitFor({ state: "visible" });

    // Click the subitem link
    await subItemLink.click();
};

/**
 * Suspend a user as a full moderator using the UI
 * Requires E2E_MODERATOR_PASSWORD environment variable to be set
 */
export const banUserAsModerator = async (
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>,
    targetUsername: string,
    banReason: string = "E2E test suspension",
) => {
    const moderatorPassword = process.env.E2E_MODERATOR_PASSWORD;
    if (!moderatorPassword) {
        throw new Error(
            "E2E_MODERATOR_PASSWORD environment variable must be set to suspend users in e2e tests",
        );
    }

    const uniqueIPv6 = generateUniqueTestIPv6();
    const modContext = await createContext({
        extraHTTPHeaders: {
            "X-Forwarded-For": uniqueIPv6,
        },
    });
    const modPage = await modContext.newPage();

    await loginAsUser(modPage, "E2E_MODERATOR", moderatorPassword);

    // Navigate to the user's profile
    await goToUsersProfile(modPage, targetUsername);

    // Click on the player link to open the dropdown menu
    // Use first() to handle cases where multiple Player elements exist during page load
    const playerLink = modPage.locator(`a.Player:has-text("${targetUsername}")`).first();
    await expect(playerLink).toBeVisible();
    await playerLink.hover();
    await playerLink.click();

    // Click the Suspend button
    const banButton = await expectOGSClickableByName(modPage, /Suspend/);
    await banButton.click();

    // Fill in the ban modal
    await expect(modPage.locator(".BanModal")).toBeVisible();

    // Fill in the public reason (required, minimum 3 characters)
    const publicReasonTextarea = modPage.locator(".BanModal textarea").first();
    await publicReasonTextarea.fill(banReason);

    // Click the Suspend button in the modal
    const confirmSuspendButton = await expectOGSClickableByName(modPage, /^Suspend$/);
    await confirmSuspendButton.click();

    // Wait for the modal to close as confirmation the suspension was successful
    await expect(modPage.locator(".BanModal")).toBeHidden();
    log("Suspend modal closed - suspension request completed");

    // Give the server a moment to process the suspension
    await modPage.waitForTimeout(500);

    await modPage.close();
    await modContext.close();
};
