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

import { fillOutChallengeForm } from "@helpers/challenge-utils";
import { expectOGSClickableByName } from "@helpers/matchers";

export const chBasicCreationTest = async ({ browser }: { browser: Browser }) => {
    const { userPage: challengerPage } = await prepareNewUser(
        browser,
        newTestUsername("ChBasic"), // cspell:disable-line
        "test",
    );

    await challengerPage.goto("/play");

    const customGames = await expectOGSClickableByName(challengerPage, "Explore custom games");
    await customGames.click();

    const createButton = await expectOGSClickableByName(challengerPage, "Create a custom game");
    await createButton.click();

    await expect(challengerPage.locator(".header")).toContainText("Custom Game");

    await fillOutChallengeForm(challengerPage, {
        gameName: "E2E Test game",
        boardSize: "19x19",
        speed: "blitz",
        timeControl: "byoyomi",
        mainTime: "2",
    });

    await expectOGSClickableByName(challengerPage, "Create Game");

    // Set up request interception
    await challengerPage.route("**/challenges", async (route) => {
        const request = route.request();
        const requestBody = JSON.parse(request.postData() || "{}");

        // Log the complete game object for inspection
        //console.log("Complete game object:", JSON.stringify(requestBody.game, null, 2));

        // Verify all game parameters (as observed from the working component)
        expect(requestBody.game.name).toBe("E2E Test game");
        expect(requestBody.game.rules).toBe("japanese");
        expect(requestBody.game.ranked).toBe(true);
        expect(requestBody.game.width).toBe(19);
        expect(requestBody.game.height).toBe(19);
        expect(requestBody.game.handicap).toBe(0);
        expect(requestBody.game.komi_auto).toBe("automatic");
        expect(requestBody.game.komi).toBe(null);
        expect(requestBody.game.disable_analysis).toBe(false);
        expect(requestBody.game.initial_state).toBe(null);
        expect(requestBody.game.private).toBe(false);
        expect(requestBody.game.rengo).toBe(false);
        expect(requestBody.game.rengo_casual_mode).toBe(true);
        expect(requestBody.game.time_control).toBe("byoyomi");
        expect(requestBody.game.time_control_parameters).toEqual({
            main_time: 2,
            period_time: 2,
            periods: 1,
            periods_min: 1,
            periods_max: 10,
            pause_on_weekends: false,
            speed: "blitz",
            system: "byoyomi",
            time_control: "byoyomi",
        });
        expect(requestBody.game.pause_on_weekends).toBe(false);

        // Abort the request after verification - we don't want to have to clean up open challenges on the server
        await route.abort();
    });

    // Click the create button
    await challengerPage.click('button:has-text("Create Game")');

    // Clean up the route handler
    await challengerPage.unroute("**/challenges");
};
