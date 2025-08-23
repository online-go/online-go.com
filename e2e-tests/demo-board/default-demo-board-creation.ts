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
import { loadDemoBoardCreationModal, fillOutDemoBoardCreationForm } from "@helpers/demo-board-utils"

export const demoBoardCreation = async ({ browser }: { browser: Browser }) => {
    const { userPage: page } = await prepareNewUser(
        browser,
        newTestUsername("DemoBasic"), // cspell:disable-line
        "test",
    );

    await loadDemoBoardCreationModal(page);

    await fillOutDemoBoardCreationForm(page, {});

    await page.click('button:has-text("Create Demo")');

    await expect(page).toHaveURL(/.*demo.*/);
    await expect(page.locator(".game-state")).toContainText("Review by");
    await expect(page.locator(".Goban")).toHaveCount(2);

    await expect(page.locator(".condensed-game-ranked")).toHaveText(("Unranked"));
    await expect(page.locator(".condensed-game-rules")).toContainText(("Japanese"));
};
