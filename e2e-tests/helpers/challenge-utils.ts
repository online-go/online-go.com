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
import { expectOGSClickableByName } from "@helpers/matchers";

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
    invite_only?: boolean;
    ranked?: boolean;
    aga_ranked?: boolean; // I see we sent this, I don't know what sets it
    restrict_rank?: boolean;
    handicap?: string;
    komi?: string;
    // Can be either a rank index (5-38) or text like "25 Kyu", "1 Dan", etc.
    rank_min?: number | string;
    rank_max?: number | string;
    rules?: string;
    width?: number;
    height?: number;
    komi_auto?: string;
    disable_analysis?: boolean;
    rengo?: boolean;
    rengo_casual_mode?: boolean;
    rengo_auto_start?: string;
    pause_on_weekends?: boolean;
    time_control_parameters?: {
        main_time?: number;
        period_time?: number;
        periods?: number;
        periods_min?: number;
        periods_max?: number;
        pause_on_weekends?: boolean;
        speed?: string;
        system?: string;
        time_control?: string;
    };
}

// This is the "default that we use to create challenges".
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

// Define all valid fields for each interface
const validFields: Record<string, readonly string[]> = {
    ChallengePOSTPayload: [
        'initialized',
        'min_ranking',
        'max_ranking',
        'challenger_color',
        'rengo_auto_start',
        'invite_only',
        'game',
        'aga_ranked'
    ] as const,
    DemoBoardPOSTPayload: [
        'name',
        'rules',
        'width',
        'height',
        'komi_auto',
        'black_name',
        'black_ranking',
        'white_name',
        'white_ranking',
        'private',
        'black_pro',
        'white_pro'
    ] as const
};

// Helper function to check for unexpected fields in the request body
const checkForUnexpectedFields = <T extends keyof typeof validFields>(
    requestBody: any,
    interfaceName: T
) => {
    const expectedFields = validFields[interfaceName];
    const unexpectedFields = Object.keys(requestBody).filter(
        (field) => !expectedFields.includes(field)
    );
    if (unexpectedFields.length > 0) {
        throw new Error(
            `Unexpected fields found in request body: ${unexpectedFields.join(", ")}`
        );
    }
};

export interface ChallengePOSTPayload {
    initialized?: boolean;
    min_ranking?: number;
    max_ranking?: number;
    challenger_color?: string;
    rengo_auto_start?: number;
    invite_only?: boolean;
    game: {
        name?: string;
        rules?: string;
        ranked?: boolean;
        width?: number;
        height?: number;
        handicap?: number;
        komi_auto?: string;
        komi?: number | null;
        disable_analysis?: boolean;
        initial_state?: any;
        private?: boolean;
        rengo?: boolean;
        rengo_casual_mode?: boolean;
        time_control?: string;
        time_control_parameters?: {
            main_time?: number;
            per_move?: number;
            period_time?: number;
            periods?: number;
            periods_min?: number;
            periods_max?: number;
            pause_on_weekends?: boolean;
            speed?: string;
            system?: string;
            time_control?: string;
        };
        pause_on_weekends?: boolean;
    };
}
interface DemoBoardPOSTPayload {
    name?: string;
    rules?: string;
    width?: number;
    height?: number;
    komi_auto?: string;
    black_name?: string;
    black_ranking?: number;
    white_name?: string;
    white_ranking?: number;
    private?: boolean;
    black_pro?: number;
    white_pro?: number;
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

// Fill out the challenge form with the given settings.
// If any settings are not provided, the default values will be used for those fields.
// If a setting is provided as undefined, it will not be touched.
export const fillOutChallengeForm = async (
    page: Page,
    settings: ChallengeModalFields,
    options: { fillWithDefaults?: boolean } = { fillWithDefaults: true },
) => {
    const final_settings = options.fillWithDefaults
        ? { ...defaultChallengeSettings, ...settings }
        : settings;

    if (final_settings.gameName !== undefined) {
        await page.fill("#challenge-game-name", final_settings.gameName);
    }
    if (final_settings.boardSize !== undefined) {
        await page.selectOption("#challenge-board-size", final_settings.boardSize);
    }
    if (final_settings.speed !== undefined) {
        await page.selectOption("#challenge-speed", final_settings.speed);
    }
    if (final_settings.timeControl !== undefined) {
        await page.selectOption("#challenge-time-control", final_settings.timeControl);
    }
    if (final_settings.mainTime !== undefined) {
        await page.selectOption("#tc-main-time-byoyomi", final_settings.mainTime);
    }
    if (final_settings.timePerPeriod !== undefined) {
        await page.selectOption("#tc-per-period-byoyomi", final_settings.timePerPeriod);
    }
    if (final_settings.periods !== undefined) {
        await page.fill("#tc-periods-byoyomi", final_settings.periods);
    }

    if (final_settings.color !== undefined) {
        await page.selectOption("#challenge-color", final_settings.color);
    }
    if (final_settings.private !== undefined) {
        const checkbox = page.locator("#challenge-private");
        await checkbox.setChecked(final_settings.private);
    }
    if (final_settings.ranked !== undefined) {
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
    if (final_settings.handicap !== undefined) {
        await page.selectOption("#challenge-handicap", { value: final_settings.handicap });
    }
    if (final_settings.komi !== undefined) {
        // First set komi to custom if needed
        if (final_settings.komi !== "automatic") {
            await page.selectOption("#challenge-komi", { value: "custom" });
            await page.fill("#challenge-komi-value", final_settings.komi.toString());
        }
    }

    if (final_settings.rengo !== undefined) {
        if (final_settings.ranked) {
            throw new Error("Rengo games cannot be ranked");
        }
        const checkbox = page.locator("#rengo-option");
        await checkbox.setChecked(final_settings.rengo);

        if (final_settings.rengo_casual_mode !== undefined) {
            const casual_checkbox = page.locator("#rengo-casual-mode");
            await casual_checkbox.setChecked(final_settings.rengo_casual_mode);
        }

        if (final_settings.rengo_casual_mode && final_settings.rengo_auto_start !== undefined) {
            const auto_start_input = page.locator("#rengo-auto-start");
            await auto_start_input.fill(final_settings.rengo_auto_start);
        }
    }

    if (final_settings.invite_only !== undefined) {
        const checkbox = page.locator("#challenge-invite-only");
        await checkbox.setChecked(final_settings.invite_only);
    }
};

// Verify that the challenge form fields match the expected values
export const checkChallengeForm = async (page: Page, settings: ChallengeModalFields) => {
    if (settings.gameName) {
        await expect(page.locator("#challenge-game-name")).toHaveValue(settings.gameName);
    }
    if (settings.boardSize) {
        await expect(page.locator("#challenge-board-size")).toHaveValue(settings.boardSize);
    }
    if (settings.speed) {
        await expect(page.locator("#challenge-speed")).toHaveValue(settings.speed);
    }
    if (settings.timeControl) {
        await expect(page.locator("#challenge-time-control")).toHaveValue(settings.timeControl);
    }
    if (settings.mainTime) {
        await expect(page.locator("#tc-main-time-byoyomi")).toHaveValue(settings.mainTime);
    }
    if (settings.timePerPeriod) {
        await expect(page.locator("#tc-per-period-byoyomi")).toHaveValue(settings.timePerPeriod);
    }
    if (settings.periods) {
        await expect(page.locator("#tc-periods-byoyomi")).toHaveValue(settings.periods);
    }

    if (settings.color) {
        await expect(page.locator("#challenge-color")).toHaveValue(settings.color);
    }
    if (settings.private !== undefined) {
        const checkbox = page.locator("#challenge-private");
        if (settings.private) {
            await expect(checkbox).toBeChecked();
        } else {
            await expect(checkbox).not.toBeChecked();
        }
    }

    if (settings.invite_only !== undefined) {
        const checkbox = page.locator("#challenge-invite-only");
        if (settings.invite_only) {
            await expect(checkbox).toBeChecked();
        } else {
            await expect(checkbox).not.toBeChecked();
        }
    }
    if (settings.ranked !== undefined) {
        const checkbox = page.locator("#challenge-ranked");
        if (settings.ranked) {
            await expect(checkbox).toBeChecked();
        } else {
            await expect(checkbox).not.toBeChecked();
        }
    }
    if (settings.restrict_rank !== undefined) {
        const checkbox = page.locator("#challenge-restrict-rank");
        if (settings.restrict_rank) {
            await expect(checkbox).toBeChecked();
        } else {
            await expect(checkbox).not.toBeChecked();
        }
    }
    if (settings.rank_min !== undefined) {
        await expect(page.locator("#challenge-min-rank")).toHaveValue(
            getRankIndex(settings.rank_min),
        );
    }
    if (settings.rank_max !== undefined) {
        await expect(page.locator("#challenge-max-rank")).toHaveValue(
            getRankIndex(settings.rank_max),
        );
    }
    if (settings.handicap) {
        await expect(page.locator("#challenge-handicap")).toHaveValue(settings.handicap);
    }
    if (settings.komi) {
        if (settings.komi === "automatic") {
            await expect(page.locator("#challenge-komi")).toHaveValue("automatic");
        } else {
            await expect(page.locator("#challenge-komi")).toHaveValue("custom");
            await expect(page.locator("#challenge-komi-value")).toHaveValue(
                settings.komi.toString(),
            );
        }
    }
    if (settings.rules) {
        await expect(page.locator("#challenge-rules")).toHaveValue(settings.rules);
    }
    if (settings.disable_analysis !== undefined) {
        const checkbox = page.locator("#challenge-disable-analysis");
        if (settings.disable_analysis) {
            await expect(checkbox).toBeChecked();
        } else {
            await expect(checkbox).not.toBeChecked();
        }
    }
    if (settings.rengo !== undefined) {
        const checkbox = page.locator("#rengo-option");
        if (settings.rengo) {
            await expect(checkbox).toBeChecked();

            if (settings.rengo_casual_mode !== undefined) {
                const casual_checkbox = page.locator("#rengo-casual-mode");
                await expect(casual_checkbox).toBeVisible();
                if (settings.rengo_casual_mode) {
                    await expect(casual_checkbox).toBeChecked();
                } else {
                    await expect(casual_checkbox).not.toBeChecked();
                }
            }
        } else {
            await expect(checkbox).not.toBeChecked();
            const casual_checkbox = page.locator("#rengo-casual-mode");
            await expect(casual_checkbox).not.toBeVisible();
        }
    }

    if (settings.time_control_parameters) {
        const params = settings.time_control_parameters;
        if (params.main_time !== undefined) {
            await expect(page.locator("#tc-main-time-byoyomi")).toHaveValue(
                params.main_time.toString(),
            );
        }
        if (params.period_time !== undefined) {
            await expect(page.locator("#tc-per-period-byoyomi")).toHaveValue(
                params.period_time.toString(),
            );
        }
        if (params.periods !== undefined) {
            await expect(page.locator("#tc-periods-byoyomi")).toHaveValue(
                params.periods.toString(),
            );
        }
        if (params.speed) {
            await expect(page.locator("#challenge-speed")).toHaveValue(params.speed);
        }
        if (params.system) {
            await expect(page.locator("#challenge-time-control")).toHaveValue(params.system);
        }
        if (params.time_control) {
            await expect(page.locator("#challenge-time-control")).toHaveValue(params.time_control);
        }
        if (params.pause_on_weekends !== undefined) {
            const checkbox = page.locator("#challenge-pause-on-weekends");
            if (params.pause_on_weekends) {
                await expect(checkbox).toBeChecked();
            } else {
                await expect(checkbox).not.toBeChecked();
            }
        }
    }
};
export const testChallengePOSTPayload = async (
    page: Page,
    expectedPayload: ChallengePOSTPayload,
    options: { logRequestBody?: boolean } = { logRequestBody: false },
) => {
    await page.route("**/challenges", async (route) => {
        const request = route.request();
        const requestBody = JSON.parse(request.postData() || "{}");

        if (options.logRequestBody) {
            console.log("Challenge POST payload:", JSON.stringify(requestBody, null, 2));
        }

        checkForUnexpectedFields(requestBody, 'ChallengePOSTPayload');

        // Verify top-level fields
        if (expectedPayload.initialized !== undefined) {
            expect(requestBody.initialized).toBe(expectedPayload.initialized);
        }
        if (expectedPayload.min_ranking !== undefined) {
            expect(requestBody.min_ranking).toBe(expectedPayload.min_ranking);
        }
        if (expectedPayload.max_ranking !== undefined) {
            expect(requestBody.max_ranking).toBe(expectedPayload.max_ranking);
        }
        if (expectedPayload.challenger_color !== undefined) {
            expect(requestBody.challenger_color).toBe(expectedPayload.challenger_color);
        }
        if (expectedPayload.rengo_auto_start !== undefined) {
            expect(requestBody.rengo_auto_start).toBe(expectedPayload.rengo_auto_start);
        }

        // Verify all game parameters
        if (expectedPayload.game.name !== undefined) {
            expect(requestBody.game.name).toBe(expectedPayload.game.name);
        }
        if (expectedPayload.game.rules !== undefined) {
            expect(requestBody.game.rules).toBe(expectedPayload.game.rules);
        }
        if (expectedPayload.game.ranked !== undefined) {
            expect(requestBody.game.ranked).toBe(expectedPayload.game.ranked);
        }
        if (expectedPayload.game.width !== undefined) {
            expect(requestBody.game.width).toBe(expectedPayload.game.width);
        }
        if (expectedPayload.game.height !== undefined) {
            expect(requestBody.game.height).toBe(expectedPayload.game.height);
        }
        if (expectedPayload.game.handicap !== undefined) {
            expect(requestBody.game.handicap).toBe(expectedPayload.game.handicap);
        }
        if (expectedPayload.game.komi_auto !== undefined) {
            expect(requestBody.game.komi_auto).toBe(expectedPayload.game.komi_auto);
        }
        if (expectedPayload.game.komi !== undefined) {
            expect(requestBody.game.komi).toBe(expectedPayload.game.komi);
        }
        if (expectedPayload.game.disable_analysis !== undefined) {
            expect(requestBody.game.disable_analysis).toBe(expectedPayload.game.disable_analysis);
        }
        if (expectedPayload.game.initial_state !== undefined) {
            expect(requestBody.game.initial_state).toBe(expectedPayload.game.initial_state);
        }
        if (expectedPayload.game.private !== undefined) {
            expect(requestBody.game.private).toBe(expectedPayload.game.private);
        }
        if (expectedPayload.invite_only !== undefined) {
            expect(requestBody.invite_only).toBe(expectedPayload.invite_only);
        }
        if (expectedPayload.game.rengo !== undefined) {
            expect(requestBody.game.rengo).toBe(expectedPayload.game.rengo);
        }
        if (expectedPayload.game.rengo_casual_mode !== undefined) {
            expect(requestBody.game.rengo_casual_mode).toBe(expectedPayload.game.rengo_casual_mode);
        }
        if (expectedPayload.game.time_control !== undefined) {
            expect(requestBody.game.time_control).toBe(expectedPayload.game.time_control);
        }
        if (expectedPayload.game.time_control_parameters !== undefined) {
            expect(requestBody.game.time_control_parameters).toEqual(
                expectedPayload.game.time_control_parameters,
            );
        }
        if (expectedPayload.game.pause_on_weekends !== undefined) {
            expect(requestBody.game.pause_on_weekends).toBe(expectedPayload.game.pause_on_weekends);
        }

        // Abort the request after verification
        await route.abort();
    });

    // Click the create button
    await page.click('button:has-text("Create Game")');

    // Clear the POST checker
    await page.unroute("**/challenges");
};

export const loadChallengeModal = async (page: Page) => {
    await page.goto("/play");

    const customGames = await expectOGSClickableByName(page, "Explore custom games");
    await customGames.click();

    const createButton = await expectOGSClickableByName(page, "Create a custom game");
    await createButton.click();

    await expect(page.locator(".header")).toContainText("Custom Game");
};

// If we've loaded it before, then we don't need to click Explore Custom Games again
export const reloadChallengeModal = async (page: Page) => {
    await page.goto("/play");

    const createButton = await expectOGSClickableByName(page, "Create a custom game");
    await createButton.click();

    await expect(page.locator(".header")).toContainText("Custom Game");
};



export const testDemoBoardPOSTPayload = async (
    page: Page,
    expectedPayload: DemoBoardPOSTPayload,
    options: { logRequestBody?: boolean } = { logRequestBody: false },
) => {
    await page.route("**/demos", async (route) => {
        const request = route.request();
        const requestBody = JSON.parse(request.postData() || "{}");

        if (options.logRequestBody) {
            console.log("Demo POST payload:", JSON.stringify(requestBody, null, 2));
        }

        checkForUnexpectedFields(requestBody, 'DemoBoardPOSTPayload');

        // Verify demo board specific fields
        if (expectedPayload.name !== undefined) {
            expect(requestBody.name).toBe(expectedPayload.name);
        }
        if (expectedPayload.rules !== undefined) {
            expect(requestBody.rules).toBe(expectedPayload.rules);
        }
        if (expectedPayload.width !== undefined) {
            expect(requestBody.width).toBe(expectedPayload.width);
        }
        if (expectedPayload.height !== undefined) {
            expect(requestBody.height).toBe(expectedPayload.height);
        }
        if (expectedPayload.komi_auto !== undefined) {
            expect(requestBody.komi_auto).toBe(expectedPayload.komi_auto);
        }
        if (expectedPayload.black_name !== undefined) {
            expect(requestBody.black_name).toBe(expectedPayload.black_name);
        }
        if (expectedPayload.black_ranking !== undefined) {
            expect(requestBody.black_ranking).toBe(expectedPayload.black_ranking);
        }
        if (expectedPayload.white_name !== undefined) {
            expect(requestBody.white_name).toBe(expectedPayload.white_name);
        }
        if (expectedPayload.white_ranking !== undefined) {
            expect(requestBody.white_ranking).toBe(expectedPayload.white_ranking);
        }
        if (expectedPayload.private !== undefined) {
            expect(requestBody.private).toBe(expectedPayload.private);
        }
        
        if (expectedPayload.black_pro !== undefined) {
            expect(requestBody.black_pro).toBe(expectedPayload.black_pro);
        }
        if (expectedPayload.white_pro !== undefined) {
            expect(requestBody.white_pro).toBe(expectedPayload.white_pro);
        }

        // Abort the request after verification
        await route.abort();
    });

    // Click the create button
    await page.click('button:has-text("Create Demo")');

    // Clear the POST checker
    await page.unroute("**/demos");
};