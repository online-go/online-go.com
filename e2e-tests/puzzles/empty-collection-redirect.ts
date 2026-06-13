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
import { CreateContextOptions, load } from "@helpers";
import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import { expectOGSClickableByName } from "@helpers/matchers";

/**
 * An empty puzzle collection has no starting puzzle, so the
 * /puzzle-collection/:id resolver can't forward to a puzzle. Instead of
 * bouncing the user back to the puzzle catalog, it should show the collection
 * page (the same PuzzleLibrary list used in the puzzle view's library panel)
 * with no entries, from which the owner can add the first puzzle.
 *
 * Covers both entry points:
 *  - creating a new collection from the "My puzzles" list (goes straight to
 *    the new-puzzle editor bound to the collection)
 *  - clicking a still-empty collection row in that list (shows the empty
 *    collection page, whose "New puzzle" link leads to the editor)
 */
export const emptyCollectionRedirectTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== Empty Puzzle Collection Redirect Test ===");

    const username = newTestUsername("pzl-emptycol");
    const { userPage } = await prepareNewUser(createContext, username, "test123");

    // Navigate to "My puzzles" as a user would: catalog -> My puzzles link
    await load(userPage, "/puzzles");
    const myPuzzlesLink = await expectOGSClickableByName(userPage, /My puzzles/);
    await myPuzzlesLink.click();
    await expect(userPage).toHaveURL(/\/puzzle-collections\/\d+/, { timeout: 10000 });
    log("On puzzle collection list page");

    // Create a new (empty) collection
    const newCollectionButton = await expectOGSClickableByName(userPage, /New puzzle collection/);
    await newCollectionButton.click();

    // Use the unique username in the name to avoid collisions on retry
    const collectionName = `Collection ${username}`;
    const swalInput = userPage.locator(".swal2-input");
    await expect(swalInput).toBeVisible({ timeout: 5000 });
    await swalInput.fill(collectionName);
    await expect(swalInput).toHaveValue(collectionName);
    await userPage.locator(".swal2-confirm").click();

    // We should land in the new-puzzle editor bound to the new collection,
    // not back on the puzzle catalog
    await expect(userPage).toHaveURL(/\/puzzle\/new\?collection_id=\d+/, { timeout: 15000 });
    log("Creating a collection landed on the new-puzzle editor");

    const setupButton = userPage.locator("button.active", { hasText: "Setup" });
    await expect(setupButton).toBeVisible({ timeout: 15000 });

    // The editor's collection dropdown should have the new collection selected
    const collectionId = new URL(userPage.url()).searchParams.get("collection_id");
    if (!collectionId) {
        throw new Error("Expected collection_id query parameter on the editor URL");
    }
    const collectionSelect = userPage.locator("select").filter({
        has: userPage.locator('option:has-text("Select collection")'),
    });
    await expect(collectionSelect).toBeVisible();
    await expect(collectionSelect).toHaveValue(collectionId);
    log(`Editor pre-bound to new collection ${collectionId}`);

    // Clicking the still-empty collection in "My puzzles" should show the
    // empty collection page, not bounce to the catalog
    await load(userPage, "/puzzles");
    const myPuzzlesLinkAgain = await expectOGSClickableByName(userPage, /My puzzles/);
    await myPuzzlesLinkAgain.click();
    await expect(userPage).toHaveURL(/\/puzzle-collections\/\d+/, { timeout: 10000 });

    const collectionRow = userPage.locator("tr", { hasText: collectionName });
    await expect(collectionRow).toBeVisible({ timeout: 10000 });
    // Click the collection name text rather than the row in general: the name
    // cell also contains a Player link, and other cells could reorder
    await collectionRow.locator("td.name").getByText(collectionName).click();

    await expect(userPage).toHaveURL(new RegExp(`/puzzle-collection/${collectionId}`), {
        timeout: 15000,
    });
    await expect(userPage.locator(".PuzzleLibrary-title")).toHaveText(collectionName, {
        timeout: 15000,
    });
    await expect(userPage.getByText("This collection doesn't have any puzzles yet.")).toBeVisible();
    log("Visiting the empty collection landed on the empty collection page");

    // The owner's "New puzzle" link should lead to the editor bound to the
    // collection
    const newPuzzleLink = await expectOGSClickableByName(userPage, /New puzzle$/);
    await newPuzzleLink.click();

    await expect(userPage).toHaveURL(new RegExp(`/puzzle/new\\?collection_id=${collectionId}`), {
        timeout: 15000,
    });
    await expect(userPage.locator("button.active", { hasText: "Setup" })).toBeVisible({
        timeout: 15000,
    });
    log("New puzzle link from the empty collection page landed on the editor");

    log("=== Empty Puzzle Collection Redirect Test Complete ===");
};
