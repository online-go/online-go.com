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

import { newTestUsername, prepareNewUser, selectNavMenuItem } from "@helpers/user-utils";
import { testDemoBoardPOSTPayload } from "@helpers/challenge-utils";

export const chDemoBoardTest = async ({ browser }: { browser: Browser }) => {
    const { userPage: creatorPage } = await prepareNewUser(
        browser,
        newTestUsername("ChDemoBoard"), // cspell:disable-line
        "test",
    );

    await selectNavMenuItem(creatorPage, "Open tools menu", "Demo Board");

    const demo_board_header = creatorPage.locator('.header:has-text("Demo Board")');

    await expect(demo_board_header).toBeVisible();

    // See if it looks like the Demo Board form, which is a cut-down
    // ChallengeModal

    // (actually, this might be best done with a screenshot :) )

    // gak broken label-for link here
    const game_name_input = creatorPage.locator(
        'label:has-text("Game Name") + div.controls input[type="text"]',
    );
    await expect(game_name_input).toBeVisible();

    const private_checkbox = creatorPage.locator("#challenge-private");
    await expect(private_checkbox).toBeVisible();

    const rengo_checkbox = creatorPage.locator("#rengo-option");
    await expect(rengo_checkbox).not.toBeVisible();

    const auto_start_input = creatorPage.locator("#rengo-auto-start");
    await expect(auto_start_input).not.toBeVisible();

    const ranked_checkbox = creatorPage.locator("#challenge-ranked");
    await expect(ranked_checkbox).not.toBeVisible();

    const invite_only_checkbox = creatorPage.locator("#invite-only-option");
    await expect(invite_only_checkbox).not.toBeVisible();

    const create_button = creatorPage.locator('button:has-text("Create Demo")');
    await expect(create_button).toBeVisible();

    // Verify there is a text input for the black player name
    // gak broken label-for link here
    const blackPlayerInput = creatorPage.locator(
        'label:has-text("Black Player") + div.controls input[type="text"]',
    );
    await expect(blackPlayerInput).toBeVisible();

    // Verify there is a rank selector for the black player
    const blackPlayerRank = creatorPage
        .locator("#challenge-advanced-fields div")
        .filter({ hasText: "Black PlayerRank" })
        .getByRole("combobox");
    await expect(blackPlayerRank).toBeVisible();

    // Verify there is a text input for the white player name
    // gak broken label-for link here
    const whitePlayerInput = creatorPage.locator(
        'label:has-text("White Player") + div.controls input[type="text"]',
    );
    await expect(whitePlayerInput).toBeVisible();

    // Verify there is a rank selector for the white player
    const whitePlayerRank = creatorPage
        .locator("#challenge-advanced-fields div")
        .filter({ hasText: "White PlayerRank" })
        .getByRole("combobox");
    await expect(whitePlayerRank).toBeVisible();

    // These are the default values for the demo board
    await testDemoBoardPOSTPayload(creatorPage, {
        name: "Demo Board",
        rules: "japanese",
        width: 19,
        height: 19,
        komi_auto: "automatic",
        black_name: "Black",
        black_ranking: 39,
        white_name: "White",
        white_ranking: 39,
        private: false,
        black_pro: 1,
        white_pro: 1,
    });
    await creatorPage.waitForLoadState("networkidle");
};
