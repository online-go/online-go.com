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

import { expect } from "@playwright/test";
import { Page } from "@playwright/test";


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
    black_name: "Black",
    black_ranking: 1039,
    white_name: "White",
    white_ranking: 1039
}


export const loadDemoBoardCreationModal = async (page: Page) => {
    const toolsButton = page.getByText("Tools", { exact: true });
    await expect(toolsButton).toBeVisible();
    await toolsButton.click();

    const demoBoardButton = page.getByRole("button", { name:"Demo Board" })
    await expect(demoBoardButton).toBeVisible();
    await demoBoardButton.click()
}

export const fillOutDemoBoardCreationForm = async (
    page: Page,
    settings: DemoBoardModalFields,
    options: { fillWithDefaults?: boolean } = { fillWithDefaults: true },
) => {
    const final_settings = options.fillWithDefaults
        ? { ...defaultDemoBoardSettings, ...settings }
        : settings;

    if (final_settings.gameName != undefined) {
        await page.fill("#challenge-game-name", final_settings.gameName);
    }

    if (final_settings.private !== undefined) {
        const checkbox = page.locator("#challenge-private");
        await checkbox.setChecked(final_settings.private);
    }

    if (final_settings.rules) {
        await expect(page.locator("#challenge-rules")).toHaveValue(final_settings.rules);
    }
    if (final_settings.boardSize !== undefined) {
        await page.selectOption("#challenge-board-size", final_settings.boardSize);
    }

    if (final_settings.komi !== undefined) {
        // First set komi to custom if needed
        if (final_settings.komi !== "automatic") {
            await page.selectOption("#challenge-komi", { value: "custom" });
            await page.fill("#challenge-komi-value", final_settings.komi.toString());
        }
    }

    // NOTE: The elements for the name and rank of the players do not have an "id"
    // So I couldn't select them to fill them.

}
