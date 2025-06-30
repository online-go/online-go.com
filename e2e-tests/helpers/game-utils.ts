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

export const clickOnGobanIntersection = async (page: Page, coord: string) => {
    const letters = "ABCDEFGHJKLMNOPQRST"; // No "I" cspell:disable-line
    const match = coord.match(/^([A-Ta-t])([1-9]|1[0-9])$/i);
    if (!match) {
        throw new Error(`Invalid coordinate: ${coord}`);
    }

    const colLetter = match[1].toUpperCase();
    const rowNumber = parseInt(match[2], 10);

    const col = letters.indexOf(colLetter);
    if (col === -1) {
        throw new Error(`Invalid column letter: ${colLetter}`);
    }

    // Row: 19 (top) -> 0, 1 (bottom) -> 18
    const row = 19 - rowNumber;

    const goban = page.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });
    const box = await goban.boundingBox();
    if (!box) {
        throw new Error("Could not get Goban dimensions");
    }

    // Calculate margin and cell size
    const margin = box.width / 20;
    const cellSize = (box.width - 2 * margin) / 18;
    const x = box.x + margin + col * cellSize;
    const y = box.y + margin + row * cellSize;

    await page.mouse.click(x, y);
};
