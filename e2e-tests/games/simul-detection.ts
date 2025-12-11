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
 * Test that simultaneous live games are detected.
 *
 * Simul detection happens at game end: when a game ends, the system checks if
 * the player has other ongoing live games. If they do, both games are marked
 * as simul.
 *
 * This test verifies that:
 * 1. A user starts two simultaneous live games
 * 2. The second game ends while the first is still running
 * 3. The AI Detector views the finished game and SEES the simul indicator
 *
 * Uses seeded user:
 * - E2E_AI_DETECTOR: AI Detector with AI_DETECTOR moderator powers
 *
 * Requires environment variables:
 * - E2E_MODERATOR_PASSWORD: Password for E2E_AI_DETECTOR
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

import {
    generateUniqueTestIPv6,
    loginAsUser,
    newTestUsername,
    prepareNewUser,
    turnOffDynamicHelp,
} from "@helpers/user-utils";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";

import { playMoves, resignActiveGame } from "@helpers/game-utils";
import { log } from "@helpers/logger";

export const simulDetectionTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    _testInfo: TestInfo,
) => {
    // Check for required password
    const password = process.env.E2E_MODERATOR_PASSWORD;
    if (!password) {
        throw new Error("E2E_MODERATOR_PASSWORD environment variable must be set to run this test");
    }

    log("=== Simul Detection Test ===");

    // The user who plays simultaneous games
    const challengerUsername = newTestUsername("SimulDetCh"); // cspell:disable-line
    log(`Creating challenger user: ${challengerUsername}`);
    const { userPage: challengerGame1Page } = await prepareNewUser(
        createContext,
        challengerUsername,
        "test",
    );

    // Create opponent for game 1
    const opponent1Username = newTestUsername("SimDetOp1"); // cspell:disable-line
    log(`Creating first opponent user: ${opponent1Username}`);
    const { userPage: opponent1Page } = await prepareNewUser(
        createContext,
        opponent1Username,
        "test",
    );

    // Create opponent for game 2
    const opponent2Username = newTestUsername("SimDetOp2"); // cspell:disable-line
    log(`Creating second opponent user: ${opponent2Username}`);
    const { userPage: opponent2Page } = await prepareNewUser(
        createContext,
        opponent2Username,
        "test",
    );

    // === Start Game 1 ===
    log("Creating first game...");
    await createDirectChallenge(challengerGame1Page, opponent1Username, {
        ...defaultChallengeSettings,
        gameName: "E2E Simul Detection Test Game 1",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "300", // 5 minutes - plenty of time
        timePerPeriod: "30",
        periods: "5",
    });

    await acceptDirectChallenge(opponent1Page);

    // Wait for game 1 to be ready
    const goban1 = challengerGame1Page.locator(".Goban[data-pointers-bound]");
    await goban1.waitFor({ state: "visible" });
    await challengerGame1Page.waitForTimeout(1000);

    const challengerMove1 = challengerGame1Page.getByText("Your move", { exact: true });
    await expect(challengerMove1).toBeVisible();
    log("Game 1 started successfully");

    // === Start Game 2 in a new tab for challenger ===
    log("Creating second game...");
    const challengerContext = await createContext();
    const challengerGame2Page = await challengerContext.newPage();
    await loginAsUser(challengerGame2Page, challengerUsername, "test");

    await createDirectChallenge(challengerGame2Page, opponent2Username, {
        ...defaultChallengeSettings,
        gameName: "E2E Simul Detection Test Game 2",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "45",
        timePerPeriod: "10",
        periods: "1",
    });

    await acceptDirectChallenge(opponent2Page);

    // Wait for game 2 to be ready
    const goban2 = challengerGame2Page.locator(".Goban[data-pointers-bound]");
    await goban2.waitFor({ state: "visible" });
    await challengerGame2Page.waitForTimeout(1000);

    const challengerMove2 = challengerGame2Page.getByText("Your move", { exact: true });
    await expect(challengerMove2).toBeVisible();
    log("Game 2 started - both games now active!");

    // Play some moves in game 2 to give it duration
    const moves = ["D9", "E9", "D8", "E8", "D7", "E7", "D6", "E6"];
    log("Playing moves in game 2...");
    await playMoves(challengerGame2Page, opponent2Page, moves, "9x9", 500);

    // End game 2 by resignation (while game 1 is still running)
    await resignActiveGame(opponent2Page);
    log("Game 2 completed via resignation (game 1 still running)");

    // Capture the game 2 URL for the AI Detector to view
    const game2Url = challengerGame2Page.url();
    log(`Game 2 URL: ${game2Url}`);

    // === AI Detector views game 2 - should see simul indicator ===
    log("Setting up E2E_AI_DETECTOR...");
    const aiDetectorIPv6 = generateUniqueTestIPv6();
    const aiDetectorContext = await createContext({
        extraHTTPHeaders: {
            "X-Forwarded-For": aiDetectorIPv6,
        },
    });
    const aiDetectorPage = await aiDetectorContext.newPage();
    await loginAsUser(aiDetectorPage, "E2E_AI_DETECTOR", password);
    await turnOffDynamicHelp(aiDetectorPage);
    log("E2E_AI_DETECTOR logged in");

    // Navigate to game 2
    log("AI Detector navigating to game 2...");
    await aiDetectorPage.goto(game2Url);
    await aiDetectorPage.waitForLoadState("networkidle");

    // Give the page time to fully load and render
    await aiDetectorPage.waitForTimeout(2000);

    // Check that simul indicator IS visible (because game 1 was running when game 2 ended)
    log("Checking that simul indicator IS visible...");
    const simulWarning = aiDetectorPage.locator(".simul-warning");
    await expect(simulWarning).toBeVisible({ timeout: 10000 });
    await expect(simulWarning).toContainText("Simul");
    log("Simul indicator is visible as expected!");

    log("=== Simul Detection Test Complete ===");
    log("Verified that simultaneous games are detected at game end");
};
