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

// This defines the fields in the challenge modal form that need to be filled out.
export interface ChallengeModalFields {
    gameName?: string;
    boardSize?: string;
    speed?: string;
    timeControl?: string;
    mainTime?: string;
    timePerPeriod?: string;
    periods?: string;
    color?: string;
    private?: boolean;
    ranked?: boolean;
    restrict_rank?: boolean;
    handicap?: string;
    komi?: string;
    // Can be either a rank index (5-38) or text like "25 Kyu", "1 Dan", etc.
    rank_min?: number | string;
    rank_max?: number | string;
}

// Maps rank text to their corresponding select option indices
// (see src/lib/rank_utils.ts for the reverse)
const rankToIndex: Record<string, string> = {
    "25 Kyu": "5",
    "24 Kyu": "6",
    "23 Kyu": "7",
    "22 Kyu": "8",
    "21 Kyu": "9",
    "20 Kyu": "10",
    "19 Kyu": "11",
    "18 Kyu": "12",
    "17 Kyu": "13",
    "16 Kyu": "14",
    "15 Kyu": "15",
    "14 Kyu": "16",
    "13 Kyu": "17",
    "12 Kyu": "18",
    "11 Kyu": "19",
    "10 Kyu": "20",
    "9 Kyu": "21",
    "8 Kyu": "22",
    "7 Kyu": "23",
    "6 Kyu": "24",
    "5 Kyu": "25",
    "4 Kyu": "26",
    "3 Kyu": "27",
    "2 Kyu": "28",
    "1 Kyu": "29",
    "1 Dan": "30",
    "2 Dan": "31",
    "3 Dan": "32",
    "4 Dan": "33",
    "5 Dan": "34",
    "6 Dan": "35",
    "7 Dan": "36",
    "8 Dan": "37",
    "9 Dan+": "38",
};

export const getRankIndex = (rank: number | string): string => {
    if (typeof rank === "number") {
        return rank.toString();
    }
    const index = rankToIndex[rank];
    if (index === undefined) {
        throw new Error(
            `Invalid rank text: ${rank}. Must be one of: ${Object.keys(rankToIndex).join(", ")}`,
        );
    }
    return index;
};

export const defaultChallengeSettings: ChallengeModalFields = {
    gameName: "E2E Test game",
    boardSize: "19x19",
    speed: "blitz",
    timeControl: "byoyomi",
    mainTime: "2",
    timePerPeriod: "2",
    periods: "1",
    color: "black",
    private: false,
    ranked: true,
    handicap: "0",
    komi: "automatic",
    // Note that restrict-rank and private, rengo are not available in direct challenges,
    // so we can't default them.
};

// Fill out the challenge form with the given settings.
// If any settings are not provided, the default values will be used for those fields.
export const fillOutChallengeForm = async (page: Page, settings: ChallengeModalFields) => {
    const final_settings = { ...defaultChallengeSettings, ...settings };

    if (final_settings.gameName) {
        await page.fill("#challenge-game-name", final_settings.gameName);
    }
    if (final_settings.boardSize) {
        await page.selectOption("#challenge-board-size", final_settings.boardSize);
    }
    if (final_settings.speed) {
        await page.selectOption("#challenge-speed", final_settings.speed);
    }
    if (final_settings.timeControl) {
        await page.selectOption("#challenge-time-control", final_settings.timeControl);
    }
    if (final_settings.mainTime) {
        await page.selectOption("#tc-main-time-byoyomi", final_settings.mainTime);
    }
    if (final_settings.timePerPeriod) {
        await page.selectOption("#tc-per-period-byoyomi", final_settings.timePerPeriod);
    }
    if (final_settings.periods) {
        await page.fill("#tc-periods-byoyomi", final_settings.periods);
    }

    if (final_settings.color) {
        await page.selectOption("#challenge-color", final_settings.color);
    }
    if (final_settings.private !== undefined) {
        const checkbox = page.locator("#challenge-private");
        await checkbox.setChecked(final_settings.private);
    }
    if (final_settings.ranked) {
        const checkbox = page.locator("#challenge-ranked");
        await checkbox.setChecked(final_settings.ranked);
    }
    if (final_settings.restrict_rank !== undefined) {
        const checkbox = page.locator("#challenge-restrict-rank");
        await checkbox.setChecked(final_settings.restrict_rank);
    }
    if (final_settings.rank_min !== undefined) {
        await page.waitForSelector("#challenge-min-rank:not([disabled])");
        await page.selectOption("#challenge-min-rank", getRankIndex(final_settings.rank_min));
    }
    if (final_settings.rank_max !== undefined) {
        await page.waitForSelector("#challenge-max-rank:not([disabled])");
        await page.selectOption("#challenge-max-rank", getRankIndex(final_settings.rank_max));
    }
    if (final_settings.handicap) {
        await page.selectOption("#challenge-handicap", { value: final_settings.handicap });
    }
    if (final_settings.komi) {
        // First set komi to custom if needed
        if (final_settings.komi !== "automatic") {
            await page.selectOption("#challenge-komi", { value: "custom" });
            await page.fill("#challenge-komi-value", final_settings.komi.toString());
        }
    }
};

export const createDirectChallenge = async (
    page: Page,
    challenged: string,
    settings: ChallengeModalFields = {},
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
    await fillOutChallengeForm(page, settings);

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
