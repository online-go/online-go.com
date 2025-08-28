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

// (No seeded data in use)

import { Browser, expect } from "@playwright/test";
import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import {
    loadDemoBoardCreationModal,
    fillOutDemoBoardCreationForm,
} from "@helpers/demo-board-utils";

export const defaultDemoBoardCreation = async ({ browser }: { browser: Browser }) => {
    const { userPage: page } = await prepareNewUser(
        browser,
        newTestUsername("DemoDefault"), // cspell:disable-line
        "test",
    );

    await loadDemoBoardCreationModal(page);

    await fillOutDemoBoardCreationForm(page, {});

    await page.click('button:has-text("Create Demo")');

    await expect(page).toHaveURL(/.*demo.*/);

    await expect(page.locator(".game-state")).toContainText("Review by");
    await expect(page.locator(".Goban")).toHaveCount(2);

    await expect(page.locator(".condensed-game-ranked")).toHaveText("Unranked");
    await expect(page.locator(".condensed-game-rules")).toHaveText("Rules: Japanese");

    await page
        .locator("a")
        .filter({ has: page.locator("i.fa.fa-info") })
        .click();
    await page.waitForSelector(".Modal.GameInfoModal", { state: "visible" });

    await page.waitForSelector(
        '.Modal.GameInfoModal dt:has-text("Board Size") + dd:has-text("19x19")',
    );

    const blackPlayerUsername = await page
        .locator("div.black.player-name-container .Player-username")
        .innerText();
    expect(blackPlayerUsername).toBe("Demo Black Player");

    const blackPlayerRank = await page
        .locator("div.black.player-name-container .Player-rank")
        .innerText();
    expect(blackPlayerRank).toBe("[9d]");

    const whitePlayerUsername = await page
        .locator("div.white.player-name-container .Player-username")
        .innerText();
    expect(whitePlayerUsername).toBe("Demo White Player");

    const whitePlayerRank = await page
        .locator("div.white.player-name-container .Player-rank")
        .innerText();
    expect(whitePlayerRank).toBe("[4d]");
};
