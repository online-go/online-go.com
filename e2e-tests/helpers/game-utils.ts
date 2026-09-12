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

import { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { expectOGSClickableByName } from "./matchers";

type BoardSize = "19x19" | "13x13" | "9x9";

/** Finish a game through passing and scoring, starting on black's turn. */
export async function passAndScoreGame(blackPage: Page, whitePage: Page): Promise<void> {
    for (const page of [blackPage, whitePage]) {
        await expect(page.getByText(/^Your move(?: - opponent passed)?$/)).toBeVisible();
        await (await expectOGSClickableByName(page, /^Pass$/)).click();
    }

    await Promise.all(
        [blackPage, whitePage].map(async (page) => {
            await expect(page.locator(".stone-removal-buttons")).toBeVisible();
            // Accept becomes enabled after two seconds even if scoring is still running.
            await expect(page.locator(".autoscoring-in-progress")).toBeHidden({ timeout: 35000 });
        }),
    );
    await (await expectOGSClickableByName(whitePage, /^Accept removed stones/)).click();
    await expect(blackPage.locator(".white .stone-removal-accepted.accepted")).toBeVisible();
    await (await expectOGSClickableByName(blackPage, /^Accept removed stones/)).click();
    await Promise.all(
        [blackPage, whitePage].map((page) => expect(page.getByText("wins by")).toBeVisible()),
    );
}

/**
 * Wait for the board and seated player controls. AI review is optional and can
 * stay empty when no review exists; tests of AI review must request it explicitly.
 */
export const waitForGameViewReady = async (
    page: Page,
    options: { expectedPlayerCount?: number; aiReviewExpected?: boolean } = {},
): Promise<void> => {
    const expectedPlayers = options.expectedPlayerCount ?? 2;
    const aiReviewExpected = options.aiReviewExpected ?? false;

    // Goban is interactive
    await page.locator(".Goban[data-pointers-bound]").waitFor({ state: "visible" });

    // Both Player links have data-ready=true (existing marker we already use)
    await expect(page.locator('a.Player[data-ready="true"]')).toHaveCount(expectedPlayers, {
        timeout: 15000,
    });

    // Each .player-icon-container has finished rendering its data-bound
    // children (PlayerFlag is the most distinctive of those — it's only
    // emitted inside the loaded branch, not the empty SGF-placeholder branch).
    await expect(page.locator(".player-icon-container .player-flag")).toHaveCount(expectedPlayers, {
        timeout: 15000,
    });

    if (aiReviewExpected) {
        // AIReview mounts on finished 9x9/13x13/19x19 games. Once the
        // wrapper div is present its internal state changes (Processing →
        // populated graph) don't shift the surrounding layout.
        await page.locator(".AIReview").waitFor({ state: "visible", timeout: 30000 });
    }
};

export const clickInTheMiddle = async (page: Page) => {
    // Wait for the Goban to be visible
    const goban = page.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    // Get the bounding box of the Goban
    const box = await goban.boundingBox();
    if (!box) {
        throw new Error("Could not get Goban dimensions");
    }

    // Calculate center point
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Click in the center of the Goban
    await page.mouse.click(centerX, centerY);
};

export const clickOnGobanIntersection = async (
    page: Page,
    coord: string,
    boardSize: BoardSize = "19x19",
    // Optional locator to scope which Goban to click. Defaults to the first
    // pointer-bound goban on the page. Pass a scoped locator when more than
    // one such goban can be present (e.g. Kibitz compare mode where the
    // main board and the secondary analysis board are both interactive).
    gobanLocator?: Locator,
) => {
    const boardLetters: { [size: string]: string } = {
        // cspell:disable
        "19x19": "ABCDEFGHJKLMNOPQRST", // No "I"
        "13x13": "ABCDEFGHJKLMN", // No "I"
        "9x9": "ABCDEFGHJ", // No "I"
        // cspell:enable
    };

    // Fudge the maths to get the click point in the right place
    // It's something like "how much bigger is the margin than a cell"
    const marginFactor: { [size: string]: number } = {
        "19x19": 1.4,
        "13x13": 1.4, // untested
        "9x9": 1.4,
    };

    const sizeNumber = parseInt(boardSize);
    const letters = boardLetters[boardSize];
    if (!letters) {
        throw new Error(`Unsupported board size: ${boardSize}`);
    }
    const match = coord.match(/^([A-Ta-t])([1-9]|1[0-9])$/i);
    if (!match) {
        throw new Error(`Invalid coordinate: ${coord}`);
    }

    const colLetter = match[1].toUpperCase();
    const rowNumber = parseInt(match[2], 10);

    const col = letters.indexOf(colLetter);
    if (col === -1) {
        throw new Error(`Invalid column letter: ${colLetter} for board size ${boardSize}`);
    }

    // Row: N (top) -> 0, 1 (bottom) -> N-1
    const row = sizeNumber - rowNumber;

    const goban = gobanLocator ?? page.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });
    const box = await goban.boundingBox();
    if (!box) {
        throw new Error("Could not get Goban dimensions");
    }

    // Calculate margin and cell size
    const margin = (box.width * marginFactor[boardSize]) / (sizeNumber + 1);
    const cellSize = (box.width - 2 * margin) / (sizeNumber - 1);
    const x = margin + col * cellSize;
    const y = margin + row * cellSize;

    await goban.click({ position: { x, y } });
};

// This expects the board to be ready for the first player to move
// and that handicap stones are placed automatically by the system (Japanese rules)
export const playMoves = async (
    black: Page,
    white: Page,
    moves: string[],
    boardSize: BoardSize = "19x19",
    delay: number = 0,
    handicap: number = 0, // Japanese
) => {
    for (let i = 0; i < moves.length; i++) {
        const firstPlayer = handicap > 1 ? white : black;
        const secondPlayer = handicap > 1 ? black : white;
        const page = i % 2 === 0 ? firstPlayer : secondPlayer;
        await expect(page.getByText("Your move", { exact: true })).toBeVisible();
        const moveNumber = page.locator(".MoveNumberControl-move-number");
        const previousMove = await moveNumber.innerText();
        await clickOnGobanIntersection(page, moves[i], boardSize);
        await expect(moveNumber).not.toHaveText(previousMove);
        if (delay > 0) {
            await page.waitForTimeout(delay);
        }
    }
};

export const resignActiveGame = async (page: Page) => {
    const resign = page.locator(".play-buttons .resign-button");
    await expect(resign).toBeVisible();
    await resign.click();

    // Handle the confirmation dialog
    const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: "resign" });
    await expect(confirmDialog).toBeVisible();

    const confirmButton = confirmDialog.getByRole("button", { name: "Yes" });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Verify the resignation was successful
    const resignationText = page.getByText("by Resignation");
    await expect(resignationText).toBeVisible();
};

// Cancels a game that is still within its first moves. The same button becomes
// "Resign" once the game passes the cancellation window - see
// GobanEngine.gameCanBeCancelled, which allows up to 6 moves in a non-handicap
// game (5 + handicap moves when using free handicap placement).
export const cancelActiveGame = async (page: Page) => {
    const cancel = page.locator(".play-buttons .resign-button");
    await expect(cancel).toBeVisible();
    await expect(cancel).toHaveText(/Cancel game/);
    await cancel.click();

    // Handle the confirmation dialog
    const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: "cancel this game" });
    await expect(confirmDialog).toBeVisible();

    const confirmButton = confirmDialog.getByRole("button", { name: "Yes" });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Cancelling records the opponent as the winner (the canceller loses).
    // The backend also marks the game annulled, but the client only fetches
    // that flag once at mount and does not refetch it on a live end-of-game
    // transition, so "Game Annulled" never renders here without a reload -
    // wait for the outcome text instead, which does update live.
    await expect(page.getByText(/wins by Cancellation/)).toBeVisible({ timeout: 15000 });
    await expect(cancel).not.toBeVisible();
};

// Navigates the page to the user's currently-active game via the home page's
// active-games list. Useful for correspondence flow, where neither player
// auto-navigates to the new game after the challenge is accepted
// (ChallengesList.tsx:89-94 only navigates for time_per_move < 1800).
//
// Assumes the user has exactly one active game when called (true for
// freshly-created e2e users). Clicks the first .MiniGoban.link on /overview
// and waits for the goban to be ready.
export const navigateToActiveGame = async (page: Page) => {
    await page.goto("/overview");
    const gameLink = page.locator(".MiniGoban.link").first();
    await expect(gameLink).toBeVisible({ timeout: 10000 });
    await gameLink.click();
    const goban = page.locator(".Goban[data-pointers-bound]");
    await expect(goban).toBeVisible({ timeout: 10000 });
};
