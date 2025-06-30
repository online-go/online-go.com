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
import { clickOnGobanIntersection } from "@helpers/game-utils";

export const airBasicCreationTest = async ({ browser }: { browser: Browser }) => {
    const { userPage: challengerPage } = await prepareNewUser(
        browser,
        newTestUsername("AiRBasicCh"), // cspell:disable-line
        "test",
    );

    const acceptorUsername = newTestUsername("AiRBasicAcc"); // cspell:disable-line
    const { userPage: acceptorPage } = await prepareNewUser(browser, acceptorUsername, "test");

    // Challenger challenges the acceptor
    await createDirectChallenge(challengerPage, acceptorUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E AI Review Test Game",
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

    await challengerPage.waitForTimeout(3000);

    // Wait for the game state to indicate it's the challenger's move
    const challengersMove = challengerPage.getByText("Your move", { exact: true });
    await expect(challengersMove).toBeVisible();

    const moves = [
        "D4",
        "Q16",
        "D16",
        "Q4",
        "K10",
        "C14",
        "C6",
        "R14",
        "R6",
        "F3",
        "C10",
        "O17",
        "F17",
        "O3",
        "Q10",
        "D10",
        "R10",
        "C12",
        "C8",
        "R12",
        "R8",
        "K4",
        "K16",
        "F4",
        "O4",
        "F16",
        "O16",
        "D7",
        "Q13",
        "D13",
        "Q7",
        "K7",
        "K13",
        "G17",
        "M17",
        "G3",
        "M3",
        "C17",
        "C3",
        "R17",
        "R3",
        "D17",
        "Q3",
        "D3",
        "Q17",
        "K17",
        "K3",
        "F5",
        "O5",
        "F15",
        "O15",
        "G5",
        "M5",
        "G15",
        "M15",
        "H4",
        "L4",
        "H16",
        "L16",
        "H5",
        "L5",
        "H15",
        "L15",
        "J4",
        "J16",
        "J5",
        "J15",
        "K5",
        "K15",
        "L6",
        "H6",
        "L14",
        "H14",
        "M6",
        "G6",
        "M14",
        "G14",
        "N4",
        "N16",
        "N5",
        "N15",
        "N6",
        "N14",
        "N12",
        "N10",
        "N8",
        "N13",
        "N11",
    ];

    for (let i = 0; i < moves.length; i++) {
        const page = i % 2 === 0 ? challengerPage : acceptorPage;
        const moveText = page.getByText("Your move", { exact: true });
        await expect(moveText).toBeVisible();
        await clickOnGobanIntersection(page, moves[i]);
    }

    const acceptorResign = acceptorPage.getByText("Resign", { exact: true });
    await expect(acceptorResign).toBeVisible();

    await acceptorResign.click();

    const acceptorConfirmResign = acceptorPage.getByText("Yes", { exact: true });
    await expect(acceptorConfirmResign).toBeVisible();

    await acceptorConfirmResign.click();

    const acceptorFinished = acceptorPage.getByText("Resignation", { exact: true });
    await expect(acceptorFinished).toBeVisible();
};
