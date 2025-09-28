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

import { Page } from "@playwright/test";
import { expect } from "@playwright/test";

type BoardSize = "19x19" | "13x13" | "9x9";

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

    const goban = page.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });
    const box = await goban.boundingBox();
    if (!box) {
        throw new Error("Could not get Goban dimensions");
    }

    // Calculate margin and cell size
    const margin = (box.width * marginFactor[boardSize]) / (sizeNumber + 1);
    const cellSize = (box.width - 2 * margin) / (sizeNumber - 1);
    const x = box.x + margin + col * cellSize;
    const y = box.y + margin + row * cellSize;

    await page.mouse.click(x, y);
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
        // Determine which player should move based on handicap
        let page;
        if (handicap > 1) {
            // White moves first after handicap stones are placed automatically
            page = i % 2 === 0 ? white : black;
        } else {
            // Black moves first (no handicap or handicap = 1)
            page = i % 2 === 0 ? black : white;
        }
        const moveText = page.getByText("Your move", { exact: true });
        await expect(moveText).toBeVisible();
        await clickOnGobanIntersection(page, moves[i], boardSize);
        await page.waitForTimeout(delay);
    }
};

export const resignActiveGame = async (page: Page) => {
    const resign = page.locator(".play-buttons .cancel-button");
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
