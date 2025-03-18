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
import { Page } from "@playwright/test";

export interface ChallengeSettings {
    gameName: string;
    boardSize: string;
    speed: string;
    timeControl: string;
    mainTime: string;
    timePerPeriod: string;
    periods: string;
    color: string;
}

export const defaultChallengeSettings: ChallengeSettings = {
    gameName: "E2E Test game",
    boardSize: "19x19",
    speed: "blitz",
    timeControl: "byoyomi",
    mainTime: "2",
    timePerPeriod: "2",
    periods: "1",
    color: "black",
};

export const createDirectChallenge = async (
    page: Page,
    challenged: string,
    settings: ChallengeSettings = defaultChallengeSettings,
) => {
    await page.fill(".OmniSearch-input", challenged);
    await page.waitForSelector(".results .result");
    await page.click(`.results .result:has-text('${challenged}')`);
    const playerLink = page.locator(`a.Player:has-text("${challenged}")`);
    await expect(playerLink).toBeVisible();
    await playerLink.hover(); // Ensure the dropdown stays open
    await playerLink.click();

    await expect(page.getByRole("button", { name: /Challenge$/ })).toBeVisible();
    await page.getByRole("button", { name: /Challenge$/ }).click();

    // Fill out the challenge form
    await page.fill("#challenge-game-name", settings.gameName);
    await page.selectOption("#challenge-board-size", settings.boardSize);
    await page.selectOption("#challenge-speed", settings.speed);
    await page.selectOption("#challenge-time-control", settings.timeControl);
    await page.selectOption("#tc-main-time-byoyomi", settings.mainTime);
    await page.selectOption("#tc-per-period-byoyomi", settings.timePerPeriod);
    await page.fill("#tc-periods-byoyomi", settings.periods);
    await page.selectOption("#challenge-color", settings.color);

    // Send the challenge
    await page.getByRole("button", { name: "Send Challenge" }).click();
    await expect(page.getByText("Waiting for opponent")).toBeVisible();
};

export const acceptDirectChallenge = async (page: Page) => {
    await page.goto("/");

    // Click skip button if present
    const skipButton = page.getByRole("button", { name: /skip/i });
    if (await skipButton.isVisible()) {
        await skipButton.click();
    }

    await page.locator(".fab.primary.raiser").click();
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
