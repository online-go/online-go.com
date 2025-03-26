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

import { Browser } from "@playwright/test";
import { expect } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";

import { getRankIndex } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";

export const cmWPreferredSettingsRankTest = async ({ browser }: { browser: Browser }) => {
    const { userPage: challengerPage } = await prepareNewUser(
        browser,
        newTestUsername("ChRankFussy"), // cspell:disable-line
        "test",
    );

    await challengerPage.goto("/play");

    const customGames = await expectOGSClickableByName(challengerPage, "Explore custom games");
    await customGames.click();

    const createButton = await expectOGSClickableByName(challengerPage, "Create a custom game");
    await createButton.click();

    // Now we save the default settings as a "preferred setting"
    // Since it's a new user, this will be "no rank restriction"
    const addButton = await expectOGSClickableByName(challengerPage, "Add current setting");
    await addButton.click();

    await expect(addButton).toBeHidden();

    const deleteButton = await expectOGSClickableByName(challengerPage, "Delete");
    await expect(deleteButton).toBeVisible();

    // Then change the rank limiter and save again

    const checkbox = challengerPage.locator("#challenge-restrict-rank");
    await expect(checkbox).toBeEnabled();
    await checkbox.setChecked(true);
    await challengerPage.waitForSelector("#challenge-min-rank:not([disabled])");
    await challengerPage.selectOption("#challenge-min-rank", getRankIndex("25 Kyu"));

    // When we change the settings, we get the option to add the new setting

    await expect(addButton).toBeVisible();
    await addButton.click();

    // Good, this means that rank restrictions are giving us new settings.

    // Check if we can select the original and have the rank restriction removed

    // Click the select container to open the dropdown
    await challengerPage
        .locator(".preferred-settings-container .ogs-react-select__control")
        .click();

    // Wait for and click the first option in the dropdown
    await challengerPage.locator(".ogs-react-select__option").first().click();

    // Check that the rank restriction is removed
    await expect(checkbox).not.toBeChecked();

    await expect(deleteButton).toBeVisible();
};
