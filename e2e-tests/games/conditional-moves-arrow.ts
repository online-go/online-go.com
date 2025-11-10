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

import type { CreateContextOptions } from "@helpers";

import { BrowserContext } from "@playwright/test";
import { expect } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { clickOnGobanIntersection, playMoves } from "@helpers/game-utils";

export const conditionalMovesArrowBugTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { userPage: challengerPage } = await prepareNewUser(
        createContext,
        newTestUsername("gamesCondCh"), // cspell:disable-line
        "test",
    );

    const acceptorUsername = newTestUsername("gamesCondAc"); // cspell:disable-line
    const { userPage: acceptorPage } = await prepareNewUser(
        createContext,
        acceptorUsername,
        "test",
    );

    const boardSize = "9x9"; // needed in two places\

    // Challenger challenges the acceptor
    await createDirectChallenge(challengerPage, acceptorUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E 'Conditional Moves' Game",
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

    const moves = ["G7", "C3", "F4", "C7"];

    await playMoves(challengerPage, acceptorPage, moves, boardSize);

    await acceptorPage
        .locator('a:has(i.fa.fa-exchange):has-text("Plan conditional moves")')
        .click();

    const conditionalMoves = acceptorPage.getByText("Conditional Move Planner");
    await expect(conditionalMoves).toBeVisible();

    // Conditionals moves entered by white
    await clickOnGobanIntersection(acceptorPage, "D7", boardSize);
    await clickOnGobanIntersection(acceptorPage, "C6", boardSize);
    await clickOnGobanIntersection(acceptorPage, "E7", boardSize);
    await clickOnGobanIntersection(acceptorPage, "E6", boardSize);

    // Arrow back through conditional moves
    await acceptorPage.keyboard.press("ArrowLeft");

    // It's a bug if we are not in Conditional Moves Planner still
    await expect(conditionalMoves).toBeVisible();
};
