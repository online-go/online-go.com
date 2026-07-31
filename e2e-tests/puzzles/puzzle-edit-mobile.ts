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
 */

import { BrowserContext, expect, Page } from "@playwright/test";
import { log } from "@helpers/logger";
import { CreateContextOptions, load } from "@helpers";
import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import { clickOnGobanIntersection } from "@helpers/game-utils";

/**
 * Editing a puzzle requires seeing the board you are editing: you place the
 * setup stones and the answer moves on it. On a phone-sized (portrait) screen
 * the edit panel used to be presented as a full-screen takeover, which hid the
 * board entirely and made it impossible to add or remove moves.
 *
 * https://forums.online-go.com/t/screen-render-bug-on-mobile-browsers/60353
 */
export const puzzleEditMobileTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== Puzzle Mobile Edit Test ===");

    const username = newTestUsername("pzl-editmob");
    const { userPage } = await prepareNewUser(createContext, username, "test123");

    const puzzleId = await createPuzzle(userPage, username);
    log(`Created puzzle ${puzzleId}`);

    // Re-open the saved puzzle on a phone-sized screen
    await userPage.setViewportSize({ width: 390, height: 844 });
    await load(userPage, `/puzzle/${puzzleId}`);

    const goban = userPage.locator(".Goban[data-pointers-bound]");
    await expect(goban).toBeVisible({ timeout: 15000 });

    const editTabButton = userPage.locator('button.GobanView-tab-button[title="Edit puzzle"]');
    await expect(editTabButton).toBeVisible({ timeout: 15000 });
    await editTabButton.click();
    log("Entered edit mode");

    // The editor is up ...
    const setupStepButton = userPage.locator("button", { hasText: "Setup" });
    await expect(setupStepButton).toBeVisible({ timeout: 15000 });

    // ... and the board is still both visible and reachable: whatever is on
    // top at the middle of the board has to be the board itself.
    await expectGobanNotCovered(userPage);
    log("Board is visible alongside the editor");

    // Prove it is actually usable: place a setup stone and see it appear
    const stonesBefore = await countStones(userPage);
    await clickOnGobanIntersection(userPage, "K10", "19x19");
    await expect
        .poll(async () => await countStones(userPage), { timeout: 10000 })
        .toBe(stonesBefore + 1);
    log("Placed a stone from the mobile editor");

    log("=== Puzzle Mobile Edit Test Complete ===");
};

/** Creates and saves a minimal puzzle, returning its id. */
async function createPuzzle(userPage: Page, username: string): Promise<string> {
    await load(userPage, "/puzzle/new");

    const setupButton = userPage.locator("button.active", { hasText: "Setup" });
    await expect(setupButton).toBeVisible({ timeout: 15000 });

    const collectionSelect = userPage.locator("select").filter({
        has: userPage.locator('option:has-text("Select collection")'),
    });
    await expect(collectionSelect).toBeVisible();
    await collectionSelect.selectOption("new");

    const swalInput = userPage.locator(".swal2-input");
    await expect(swalInput).toBeVisible({ timeout: 5000 });
    await swalInput.fill(`Puzzles ${username}`);
    await userPage.locator(".swal2-confirm").click();
    await expect(collectionSelect).not.toHaveValue("0", { timeout: 10000 });

    const nameInput = userPage.locator('input[placeholder="Puzzle name"]');
    await nameInput.fill("E2E Mobile Edit Test Puzzle");
    await expect(nameInput).toHaveValue("E2E Mobile Edit Test Puzzle");

    await clickOnGobanIntersection(userPage, "D4", "19x19");

    await userPage.locator("button.primary", { hasText: "Next" }).click();
    await expect(userPage.locator("button.active", { hasText: "Moves" })).toBeVisible({
        timeout: 5000,
    });

    await clickOnGobanIntersection(userPage, "Q16", "19x19");
    const correctAnswerButton = userPage.getByText("Correct answer");
    await correctAnswerButton.click();
    await expect(correctAnswerButton).toHaveClass(/success/);

    await userPage.locator("button.primary", { hasText: "Save" }).click();
    await expect(userPage).toHaveURL(/\/puzzle\/\d+/, { timeout: 15000 });

    const id = new URL(userPage.url()).pathname.split("/").pop();
    if (!id) {
        throw new Error("Could not determine the id of the puzzle we just created");
    }
    return id;
}

/** Fails if anything is painted over the middle of the board. */
async function expectGobanNotCovered(page: Page) {
    const box = await page.locator(".Goban[data-pointers-bound]").boundingBox();
    if (!box) {
        throw new Error("Could not get Goban dimensions");
    }

    const covering = await page.evaluate(
        ({ x, y }) => {
            const element = document.elementFromPoint(x, y);
            if (!element) {
                return "nothing (the board is off screen)";
            }
            if (element.closest(".goban-container")) {
                return null;
            }
            // Describe whatever is on top of the board for the failure message
            const panel = element.closest(".GobanView-tab-panel");
            return panel ? `.${panel.className.split(" ").join(".")}` : element.tagName;
        },
        { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    );

    expect(covering, "the middle of the board should not be covered").toBe(null);
}

async function countStones(page: Page): Promise<number> {
    return await page.evaluate(() => {
        const goban = (window as any).global_goban;
        return goban ? goban.engine.board.flat().filter((c: number) => c !== 0).length : -1;
    });
}
