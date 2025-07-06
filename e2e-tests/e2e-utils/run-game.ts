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
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves } from "@helpers/game-utils";

export const runGame = async ({ browser }: { browser: Browser }) => {
    const { userPage: challengerPage } = await prepareNewUser(
        browser,
        newTestUsername("e2eUtilsRGCh"), // cspell:disable-line
        "test",
    );

    const acceptorUsername = newTestUsername("e2eUtilsRGAc"); // cspell:disable-line
    const { userPage: acceptorPage } = await prepareNewUser(browser, acceptorUsername, "test");

    const boardSize = "19x19"; // needed in two places

    // Challenger challenges the acceptor
    await createDirectChallenge(challengerPage, acceptorUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E 'Run Game' Game",
        boardSize: boardSize,
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "45",
        timePerPeriod: "10",
        periods: "1",
    });

    // escaper accepts
    await acceptDirectChallenge(acceptorPage);

    // Challenger is black
    // Wait for the Goban to be visible & definitely ready
    const goban = challengerPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    await challengerPage.waitForTimeout(1000);

    // Wait for the game state to indicate it's the challenger's move
    let challengersMove = challengerPage.getByText("Your move", { exact: true });
    await expect(challengersMove).toBeVisible();

    challengersMove = challengerPage.getByText("Your move", { exact: true });
    await expect(challengersMove).toBeVisible();

    const moves = ["A19", "T19", "A1", "T1", "D16", "Q16", "K10", "Q4", "D4", "Q10", "D10", "K19"];

    await playMoves(challengerPage, acceptorPage, moves, boardSize);

    // Note: this assumes that it's now black to play.
    const challengerPass = challengerPage.getByText("Pass", { exact: true });
    await expect(challengerPass).toBeVisible();

    await challengerPass.click();

    const acceptorPass = acceptorPage.getByText("Pass", { exact: true });
    await expect(acceptorPass).toBeVisible();

    await acceptorPass.click();

    const acceptorAccept = acceptorPage.getByText("Accept");
    await expect(acceptorAccept).toBeVisible();

    await acceptorAccept.click();

    const challengerAccept = challengerPage.getByText("Accept");
    await expect(challengerAccept).toBeVisible();

    await challengerAccept.click();

    const acceptorFinished = acceptorPage.getByText("wins by");
    await expect(acceptorFinished).toBeVisible();

    const challengerFinished = challengerPage.getByText("wins by");
    await expect(challengerFinished).toBeVisible();
};
