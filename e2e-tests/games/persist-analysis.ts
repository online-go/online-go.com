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
import { clickOnGobanIntersection, playMoves } from "@helpers/game-utils";

export const persistAnalysisTest = async ({ browser }: { browser: Browser }) => {
    const { userPage: challengerPage } = await prepareNewUser(
        browser,
        newTestUsername("gamesPersCh"), // cspell:disable-line
        "test",
    );

    const acceptorUsername = newTestUsername("gamesPersAc"); // cspell:disable-line
    const { userPage: acceptorPage } = await prepareNewUser(browser, acceptorUsername, "test");

    const boardSize = "9x9"; // needed in two places\

    // Challenger challenges the acceptor
    await createDirectChallenge(challengerPage, acceptorUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E 'Persist Analysis' Game",
        boardSize: boardSize,
        speed: "correspondence",
        timeControl: "byoyomi",
        mainTime: "86400",
        timePerPeriod: "86400",
        periods: "1",
    });

    // escaper accepts
    await acceptDirectChallenge(acceptorPage);

    // Challenger is black
    // Wait for the Goban to be visible & definitely ready
    const goban = challengerPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    await challengerPage.waitForTimeout(1000);

    const moves = ["G7", "C3", "F4", "C7"];

    await playMoves(challengerPage, acceptorPage, moves, boardSize);

    await acceptorPage.locator('a:has(i.fa.fa-sitemap):has-text("Analyze game")').click();

    const conditionalMoves = acceptorPage.getByText("Analyze Mode");
    await expect(conditionalMoves).toBeVisible();

    // Analysis moves entered by white
    await clickOnGobanIntersection(acceptorPage, "D7", boardSize);
    await clickOnGobanIntersection(acceptorPage, "C6", boardSize);
    await clickOnGobanIntersection(acceptorPage, "E7", boardSize);
    await clickOnGobanIntersection(acceptorPage, "E6", boardSize);

    // Make sure we can actually see an analysis move
    // The analysis stones are a <g> in the <svg> in the #move-tree-container
    const firstAnalysisMove = acceptorPage.locator('#move-tree-container g:has(text:text-is("5"))');
    await expect(firstAnalysisMove).toBeVisible();

    // now reset the socket

    await acceptorPage.evaluate(() => {
        (window as any).socket.reconnect();
    });

    // Give time for the bad "disappearing analysis" to happen if it's going to.
    await acceptorPage.waitForTimeout(1000);

    // Make sure we can still see the analysis move
    await expect(firstAnalysisMove).toBeVisible();

    // TBD probably should test this after the game ends as well.
};
