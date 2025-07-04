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

// This expects the board to be ready for black to play
export const playMoves = async (
    black: Page,
    white: Page,
    moves: string[],
    boardSize: BoardSize = "19x19",
) => {
    for (let i = 0; i < moves.length; i++) {
        const page = i % 2 === 0 ? black : white;
        const moveText = page.getByText("Your move", { exact: true });
        await expect(moveText).toBeVisible();
        await clickOnGobanIntersection(page, moves[i], boardSize);
    }
};
