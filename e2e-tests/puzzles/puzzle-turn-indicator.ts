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

import { BrowserContext, expect } from "@playwright/test";
import { log } from "@helpers/logger";
import { CreateContextOptions } from "@helpers";
import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import { clickOnGobanIntersection } from "@helpers/game-utils";

export const puzzleTurnIndicatorTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== Puzzle Turn Indicator Test ===");

    const username = newTestUsername("pzl-turn");
    const { userPage } = await prepareNewUser(createContext, username, "test123");

    await userPage.goto("/puzzle/new");

    const setupButton = userPage.locator("button.active", { hasText: "Setup" });
    await expect(setupButton).toBeVisible({ timeout: 15000 });

    const collectionSelect = userPage.locator("select").filter({
        has: userPage.locator('option:has-text("Select collection")'),
    });
    await expect(collectionSelect).toBeVisible();
    await collectionSelect.selectOption("new");

    const swalInput = userPage.locator(".swal2-input");
    await expect(swalInput).toBeVisible({ timeout: 5000 });
    // Use the unique username to avoid "collection already exists" errors on retry
    await swalInput.fill(`Puzzles ${username}`);
    const swalConfirm = userPage.locator(".swal2-confirm");
    await swalConfirm.click();

    await expect(collectionSelect).not.toHaveValue("0", { timeout: 10000 });
    log("Puzzle collection created");

    const nameInput = userPage.locator('input[placeholder="Puzzle name"]');
    await nameInput.fill("E2E Turn Indicator Test Puzzle");
    await expect(nameInput).toHaveValue("E2E Turn Indicator Test Puzzle");

    const typeSelect = userPage.locator("select").filter({
        has: userPage.locator('option:has-text("Life and Death")'),
    });
    await typeSelect.selectOption("life_and_death");

    await clickOnGobanIntersection(userPage, "D4", "19x19");

    const nextButton = userPage.locator("button.primary", { hasText: "Next" });
    await nextButton.click();

    const movesButton = userPage.locator("button.active", { hasText: "Moves" });
    await expect(movesButton).toBeVisible({ timeout: 5000 });
    log("Switched to Moves step");

    await clickOnGobanIntersection(userPage, "Q16", "19x19");

    const correctAnswerButton = userPage.getByText("Correct answer");
    await correctAnswerButton.click();
    // The button gets a "success" class when active
    await expect(correctAnswerButton).toHaveClass(/success/);
    log("Marked correct answer");

    const saveButton = userPage.locator("button.primary", { hasText: "Save" });
    await saveButton.click();

    await expect(userPage).toHaveURL(/\/puzzle\/\d+\?view-collection=1/, { timeout: 15000 });
    log("Puzzle saved, redirected to puzzle page");

    const collectionTabButton = userPage.locator(
        'button.GobanView-tab-button[title="Puzzle collection"]',
    );
    await collectionTabButton.click();
    log("Clicked puzzle collection tab");

    const turnIndicator = userPage.locator(".game-state");
    await expect(turnIndicator).toBeVisible({ timeout: 15000 });
    await expect(turnIndicator).toHaveText(/Black to move|White to move/);

    const text = await turnIndicator.textContent();
    log(`Turn indicator found: "${text}"`);

    log("=== Puzzle Turn Indicator Test Complete ===");
};
