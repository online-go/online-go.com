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
import { Page, Browser } from "@playwright/test";

import { expectOGSClickableByName } from "./matchers";
import { load } from "@helpers";

// This is tweaked to provide us with lots of unique usernames but also
// a decent number of readable user-role characters, within the OGS username 20 character limit
// on registration.
export const newTestUsername = (user_role: string) => {
    if (user_role.length > 12) {
        throw new Error("user_role must be less than 13 characters");
    }
    const timestamp = Date.now().toString(36);
    // Tests take longer than a minute to run, so we can take 4 chars that change roughly minutely
    // This assumes that you don't re-run a single test more than once per minute or so (47 seconds actually)
    const midChars = timestamp.slice(-6, -2);
    return `e2e${user_role}_${midChars}`;
};

export const registerNewUser = async (browser: Browser, username: string, password: string) => {
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    await userPage.goto("/");
    // Go from "landing page" to the "sign in" page.
    await userPage.getByRole("link", { name: /sign in/i }).click();
    await expect(userPage.getByLabel("Username")).toBeVisible();
    await expect(userPage.getByLabel("Password")).toBeVisible();
    await expectOGSClickableByName(userPage, /Sign in$/);

    // From there to "Register"
    const registerPageButton = await expectOGSClickableByName(userPage, /Register here!/);
    await registerPageButton.click();

    // Fill in registration form
    await userPage.getByLabel("Username").fill(username);
    await userPage.getByLabel("Password").fill(password);
    const registerButton = await expectOGSClickableByName(userPage, /Register$/);
    await registerButton.click();

    // Verify successful registration
    await expect(userPage.getByText("Welcome")).toBeVisible();

    const userDropdown = userPage.locator(".username").getByText(username);
    await expect(userDropdown).toBeVisible();

    await userPage.waitForLoadState("networkidle");

    return {
        userPage,
        userContext,
    };
};

export const prepareNewUser = async (browser: Browser, username: string, password: string) => {
    const { userPage, userContext } = await registerNewUser(browser, username, password);

    // We need to choose _something_ to get rid of this on the Profile page:
    // typically, we don't want to see that.
    // (Quirky regex due to variable text on the button for A/B/C testing)
    const chooseButton = await expectOGSClickableByName(userPage, /^Basic/);
    await chooseButton.click();

    await expect(userPage.getByText("You're not currently playing any games")).toBeVisible();

    await turnOffDynamicHelp(userPage); // the popups can get in the way.

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
    await userPage.waitForLoadState("networkidle");
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

    await page.waitForLoadState("networkidle");
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

    await page.waitForLoadState("networkidle");
    await expect(page.locator(".username").getByText(username)).toBeVisible();

    // Save the authenticated state for Playwright
    await page.context().storageState({ path: "playwright/.auth/user.json" });
};

export const turnOffDynamicHelp = async (page: Page) => {
    await page.goto("/settings/help");
    await page.waitForLoadState("networkidle");
    const switchElement = page.locator(
        'div.PreferenceLine:has-text("Show dynamic help") input[role="switch"]',
    );
    const parentElement = page.locator('div.PreferenceLine:has-text("Show dynamic help")');
    await expect(parentElement).toBeVisible();
    const isSwitchOn = await switchElement.evaluate((el) => (el as HTMLInputElement).checked);
    if (isSwitchOn) {
        await parentElement.click();
    }
};

// actually you could set up any user using this but its unusual to need to log in
// a newly registered user.

export const setupSeededUser = async (browser: Browser, username: string) => {
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    await loginAsUser(userPage, username, "test");
    await turnOffDynamicHelp(userPage); // the popups can get in the way.

    return {
        userPage,
        userContext,
    };
};

export const setupSeededCM = async (browser: Browser, username: string) => {
    const seededCMContext = await browser.newContext();
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

// Note: if there are multiple matches, this grabs the first.   This is avoids issues if we
// accidentally have more seed games than intended.
export const goToUsersGame = async (page: Page, username: string, gameName: string) => {
    await page.fill(".OmniSearch-input", username);
    await page.waitForSelector(".results .result");
    await page.click(`.results .result:has-text('${username}')`);

    const gameHistory = page.getByText("Game History");
    await gameHistory.scrollIntoViewIfNeeded(); // assists debug
    await expect(gameHistory).toBeVisible();
    const target_game = page.getByText(gameName, { exact: true }).first();
    await expect(target_game).toBeVisible();

    // Go to that page ...
    await target_game.click();
    await expect(page.locator(".Game")).toBeVisible();
};

export const goToUsersProfile = async (page: Page, username: string) => {
    await page.fill(".OmniSearch-input", username);
    await page.waitForSelector(".results .result");
    await page.click(`.results .result:has-text('${username}')`);

    // It's actually tricky to prove we're on the profile page.  Appearance of this will have to do.
    const playerUsername = page.locator(".Player-username").getByText(username);
    await expect(playerUsername).toBeVisible();
    return playerUsername;
};

export const reportUser = async (page: Page, username: string, type: string, notes: string) => {
    const playerLink = page.locator(`a.Player:has-text("${username}")`);
    await expect(playerLink).toBeVisible();
    await playerLink.hover(); // Ensure the dropdown stays open
    await playerLink.click();

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
    await expect(countDisplay).toHaveText(`${count}`);

    return indicator;
};

export const assertIncidentReportIndicatorInactive = async (page: Page) => {
    const indicator = page.locator(".IncidentReportIndicator");
    await expect(indicator).toBeEmpty();
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
