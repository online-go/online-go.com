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

import { expect, Page, Browser } from "@playwright/test";
import { newTestUsername, prepareNewUser } from "@helpers/user-utils";

export interface DemoBoardModalFields {
    gameName?: string;
    private?: boolean;
    rules?: string;
    boardSize?: string;
    komi?: string;
    black_name?: string;
    black_ranking?: number;
    white_name?: string;
    white_ranking?: number;
}

export const defaultDemoBoardSettings: DemoBoardModalFields = {
    gameName: "E2E Demo Board",
    private: false,
    rules: "japanese",
    boardSize: "19x19",
    komi: "automatic",
    black_name: "Demo Black Player",
    black_ranking: 38, // 9 Dan
    white_name: "Demo White Player",
    white_ranking: 33, // 4 Dan
};

export const loadDemoBoardCreationModal = async (page: Page) => {
    const toolsButton = page.getByText("Tools", { exact: true });
    await expect(toolsButton).toBeVisible();
    await toolsButton.click();

    const demoBoardButton = page.getByRole("button", { name: "Demo Board" });
    await expect(demoBoardButton).toBeVisible();
    await demoBoardButton.click();
};

export const fillOutDemoBoardCreationForm = async (
    page: Page,
    settings: DemoBoardModalFields,
    options: { fillWithDefaults?: boolean } = { fillWithDefaults: true },
) => {
    const final_settings = options.fillWithDefaults
        ? { ...defaultDemoBoardSettings, ...settings }
        : settings;

    if (final_settings.gameName !== undefined) {
        await page.fill("#challenge-game-name", final_settings.gameName);
    }

    if (final_settings.private !== undefined) {
        const checkbox = page.locator("#challenge-private");
        await checkbox.setChecked(final_settings.private);
    }

    if (final_settings.rules) {
        await page.locator("#challenge-rules").selectOption(final_settings.rules);
    }
    if (final_settings.boardSize !== undefined) {
        await page.locator("#challenge-board-size").click();
        await page.waitForSelector("#challenge-board-size", { state: "visible" });
        console.log("Board Size:", final_settings.boardSize);
        await page
            .locator("select#challenge-board-size")
            .selectOption({ label: final_settings.boardSize });
    }

    if (final_settings.komi !== undefined) {
        // First set komi to custom if needed
        if (final_settings.komi !== "automatic") {
            await page.selectOption("#challenge-komi", { value: "custom" });
            await page.fill("#challenge-komi-value", final_settings.komi.toString());
        }
    }

    const blackInput = page.locator('input.form-control[type="text"][value="Black"]');
    await blackInput.fill(final_settings.black_name || "Fallback Black Player Name");

    const blackRankSelect = page
        .locator("#challenge-advanced-fields .left-pane .form-group")
        .filter({ has: page.locator('label:has-text("Rank")') })
        .locator("select.challenge-dropdown");

    await blackRankSelect.selectOption(final_settings.black_ranking?.toString() || "1");

    const whiteInput = page.locator('input.form-control[type="text"][value="White"]');
    await whiteInput.fill(final_settings.white_name || "Fallback White Player Name");

    const whiteRankSelect = page
        .locator("#challenge-advanced-fields .right-pane .form-group")
        .filter({ has: page.locator('label:has-text("Rank")') })
        .locator("select.challenge-dropdown");

    await whiteRankSelect.selectOption(final_settings.white_ranking?.toString() || "2");
};

// 1. Add a new interface for the expected outcomes
export interface DemoBoardExpectedFields {
    boardSize: string;
    rules: string;
    blackName: string;
    blackRank: string;
    whiteName: string;
    whiteRank: string;
}

// 2. Add the new high-level orchestrator function
export const createAndVerifyDemoBoard = async (
    browser: Browser,
    settings: DemoBoardModalFields,
    expected: DemoBoardExpectedFields,
) => {
    const { userPage: page } = await prepareNewUser(
        browser,
        newTestUsername("DemoE2E"), // cspell:disable-line
        "test",
    );

    // Use existing helpers for the setup
    await loadDemoBoardCreationModal(page);
    await fillOutDemoBoardCreationForm(page, settings);

    // Click create and wait for navigation
    await page.click('button:has-text("Create Demo")');
    await expect(page).toHaveURL(/.*demo.*/);

    // Perform all assertions based on the 'expected' parameter
    await expect(page.locator(".game-state")).toContainText("Review by");
    await expect(page.locator(".Goban")).toHaveCount(2);
    await expect(page.locator(".condensed-game-ranked")).toHaveText("Unranked");
    await expect(page.locator(".condensed-game-rules")).toHaveText(`Rules: ${expected.rules}`);

    await page
        .locator("a")
        .filter({ has: page.locator("i.fa.fa-info") })
        .click();
    await page.waitForSelector(".Modal.GameInfoModal", { state: "visible" });

    await page.waitForSelector(
        `.Modal.GameInfoModal dt:has-text("Board Size") + dd:has-text("${expected.boardSize}")`,
    );

    const blackPlayerUsername = await page
        .locator("div.black.player-name-container .Player-username")
        .innerText();
    expect(blackPlayerUsername).toBe(expected.blackName);

    const blackPlayerRank = await page
        .locator("div.black.player-name-container .Player-rank")
        .innerText();
    expect(blackPlayerRank).toBe(expected.blackRank);

    const whitePlayerUsername = await page
        .locator("div.white.player-name-container .Player-username")
        .innerText();
    expect(whitePlayerUsername).toBe(expected.whiteName);

    const whitePlayerRank = await page
        .locator("div.white.player-name-container .Player-rank")
        .innerText();
    expect(whitePlayerRank).toBe(expected.whiteRank);
};
