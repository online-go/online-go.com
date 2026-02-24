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
 * Test SGF download and library restrictions based on authentication and game state.
 *
 * These tests verify that for both "Download SGF" and "Add to library":
 * 1. Anonymous users cannot access SGF of in-progress games
 * 2. Players in a game cannot access SGF while the game is in progress
 * 3. Logged-in spectators CAN access SGF of in-progress games
 * 4. Anonymous users CAN download SGF of finished games (library requires login)
 * 5. Players CAN access SGF of finished games
 *
 * The restriction prevents feeding in-progress game data to AI engines for cheating.
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, expect } from "@playwright/test";
import { newTestUsername, prepareNewUser, generateUniqueTestIPv6 } from "../helpers/user-utils";
import { createDirectChallenge, acceptDirectChallenge } from "../helpers/challenge-utils";
import { playMoves, resignActiveGame } from "../helpers/game-utils";
import { log } from "@helpers/logger";

/**
 * Helper to find the "Download SGF" link in the dock.
 */
const getSgfDownloadLink = async (page: import("@playwright/test").Page) => {
    const dock = page.locator(".Dock");
    await dock.hover();
    return dock.locator("a", { hasText: "Download SGF" });
};

/**
 * Helper to check if the SGF download link is enabled (no "disabled" class).
 */
const expectSgfDownloadEnabled = async (page: import("@playwright/test").Page) => {
    const link = await getSgfDownloadLink(page);
    await expect(link).toBeVisible();
    const hasDisabled = await link.evaluate((el) => el.classList.contains("disabled"));
    expect(hasDisabled).toBe(false);
};

/**
 * Helper to check if the SGF download link is disabled (has "disabled" class).
 */
const expectSgfDownloadDisabled = async (page: import("@playwright/test").Page) => {
    const link = await getSgfDownloadLink(page);
    await expect(link).toBeVisible();
    const hasDisabled = await link.evaluate((el) => el.classList.contains("disabled"));
    expect(hasDisabled).toBe(true);
};

/**
 * Helper to find the "Add to library" link in the dock.
 */
const getAddToLibraryLink = async (page: import("@playwright/test").Page) => {
    const dock = page.locator(".Dock");
    await dock.hover();
    return dock.locator("a", { hasText: "Add to library" });
};

/**
 * Helper to check if the "Add to library" link is enabled (no "disabled" class).
 */
const expectAddToLibraryEnabled = async (page: import("@playwright/test").Page) => {
    const link = await getAddToLibraryLink(page);
    await expect(link).toBeVisible();
    const hasDisabled = await link.evaluate((el) => el.classList.contains("disabled"));
    expect(hasDisabled).toBe(false);
};

/**
 * Helper to check if the "Add to library" link is disabled (has "disabled" class).
 */
const expectAddToLibraryDisabled = async (page: import("@playwright/test").Page) => {
    const link = await getAddToLibraryLink(page);
    await expect(link).toBeVisible();
    const hasDisabled = await link.evaluate((el) => el.classList.contains("disabled"));
    expect(hasDisabled).toBe(true);
};

export const sgfDownloadRestrictionsTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== SGF Download Restrictions Test ===");

    // 1. Create two players and start a game between them
    const blackUsername = newTestUsername("SgfBlack");
    const whiteUsername = newTestUsername("SgfWhite");

    log(`Creating players: ${blackUsername} and ${whiteUsername}`);
    const { userPage: blackPage } = await prepareNewUser(createContext, blackUsername, "test");
    const { userPage: whitePage } = await prepareNewUser(createContext, whiteUsername, "test");
    log("Players created");

    // Create and accept a challenge
    log("Creating game between players...");
    await createDirectChallenge(blackPage, whiteUsername, {
        gameName: "SGF Download Test",
        boardSize: "9x9",
        speed: "live",
        mainTime: "300",
        timePerPeriod: "30",
        periods: "5",
    });
    await acceptDirectChallenge(whitePage);

    // Wait for game board to be ready on both sides
    const blackGoban = blackPage.locator(".Goban[data-pointers-bound]");
    await blackGoban.waitFor({ state: "visible" });
    const whiteGoban = whitePage.locator(".Goban[data-pointers-bound]");
    await whiteGoban.waitFor({ state: "visible" });
    log("Game started");

    // Play 6+ moves so there's something in the SGF, and so the game exits
    // the cancellation zone (< 6 moves) and can be properly resigned later
    await playMoves(blackPage, whitePage, ["E5", "D5", "F5", "C5", "G5", "B5"], "9x9");
    log("Played initial moves");

    // Capture the game URL for spectators/anonymous
    const gameUrl = blackPage.url();
    log(`Game URL: ${gameUrl}`);

    // --- Test 1: Anonymous user, in-progress game → disabled ---
    log("Test 1: Anonymous user cannot download SGF or add to library for in-progress game");
    const anonContext = await createContext({
        extraHTTPHeaders: { "X-Forwarded-For": generateUniqueTestIPv6() },
    });
    const anonPage = await anonContext.newPage();
    await anonPage.goto(gameUrl);
    await expect(anonPage.locator(".Game")).toBeVisible({ timeout: 15000 });

    await expectSgfDownloadDisabled(anonPage);
    await expectAddToLibraryDisabled(anonPage);
    log(
        "Test 1 passed: Anonymous user SGF download and add to library disabled for in-progress game",
    );

    // --- Test 2: Player in game, in-progress → disabled ---
    log("Test 2: Player cannot download SGF or add to library for their own in-progress game");
    await expectSgfDownloadDisabled(blackPage);
    await expectAddToLibraryDisabled(blackPage);
    log("Test 2 passed: Player SGF download and add to library disabled for in-progress game");

    // --- Test 3: Logged-in spectator, in-progress game → enabled ---
    log("Test 3: Logged-in spectator can download SGF and add to library for in-progress game");
    const spectatorUsername = newTestUsername("SgfSpec");
    const { userPage: spectatorPage } = await prepareNewUser(
        createContext,
        spectatorUsername,
        "test",
    );
    await spectatorPage.goto(gameUrl);
    await expect(spectatorPage.locator(".Game")).toBeVisible({ timeout: 15000 });

    await expectSgfDownloadEnabled(spectatorPage);
    await expectAddToLibraryEnabled(spectatorPage);
    log("Test 3 passed: Spectator SGF download and add to library enabled for in-progress game");

    // --- Finish the game by resignation ---
    log("Finishing game by resignation...");
    // Dismiss the Dock (still expanded from hovering during Test 2)
    // so it doesn't intercept the resign button click
    await blackPage.mouse.move(0, 0);
    await resignActiveGame(blackPage);
    log("Game finished");

    // Wait for the game-over state to propagate
    await expect(blackPage.getByText("by Resignation")).toBeVisible();

    // --- Test 4: Anonymous user, finished game → enabled ---
    log("Test 4: Anonymous user can download SGF of finished game");
    await anonPage.reload();
    await expect(anonPage.locator(".Game")).toBeVisible({ timeout: 15000 });

    await expectSgfDownloadEnabled(anonPage);
    log("Test 4 passed: Anonymous user SGF download enabled for finished game");

    // --- Test 5: Player, finished game → enabled ---
    log("Test 5: Player can download SGF and add to library for finished game");
    await expectSgfDownloadEnabled(blackPage);
    await expectAddToLibraryEnabled(blackPage);
    log("Test 5 passed: Player SGF download and add to library enabled for finished game");

    log("=== SGF Download Restrictions Test Complete ===");
};
