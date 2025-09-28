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

// incomplete test

import { Browser } from "@playwright/test";
import { expect } from "@playwright/test";

import { newTestUsername, prepareNewUser, reportUser } from "@helpers/user-utils";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves } from "@helpers/game-utils";

export const runBotDetectionTest = async ({ browser }: { browser: Browser }) => {
    const { userPage: challengerPage } = await prepareNewUser(
        browser,
        newTestUsername("RunBotDetCh"), // cspell:disable-line
        "test",
    );

    const acceptorUsername = newTestUsername("RunBotDetAc"); // cspell:disable-line
    const { userPage: acceptorPage } = await prepareNewUser(browser, acceptorUsername, "test");

    // Challenger challenges the acceptor
    await createDirectChallenge(challengerPage, acceptorUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E Games Basic Scoring Test Game",
        boardSize: "19x19",
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

    const moves = [
        "D9",
        "Q16",
        "D4",
        "Q4",
        "K10",
        "C14",
        "C6",
        "R14",
        "R6",
        "K4",
        "K16",
        "F3",
        "C10",
        "O17",
        "F17",
        "R10",
        "O3",
        "Q10",
        "D16",
        "P16",
        "P4",
        "D10",
        "C12",
        "C8",
        "R12",
        "R8",
        "K14",
        "K6",
        "H3",
        "H17",
        "O5",
        "O15",
        "F15",
        "F5",
        "P10",
        "D7",
        "Q7",
        "Q13",
        "D13",
        "P13",
        "P7",
        "K12",
        "K8",
        "H5",
        "H15",
        "O7",
        "O13",
        "F13",
        "F7",
        "P12",
        "D12",
        "Q12",
        "Q8",
        "D8",
        "P8",
        "K13",
        "K7",
        "H7",
        "H13",
        "O8",
        "O12",
        "F12",
        "F8",
        "P11",
        "D11",
        "Q11",
        "Q9",
        "P9",
        "K11",
        "K9",
        "H9",
        "H11",
        "O9",
        "O11",
        "F11",
        "F9",
        "P6",
        "D6",
        "Q6",
        "R17",
        "R3",
        "P17",
    ];

    await playMoves(challengerPage, acceptorPage, moves, "19x19");

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

    // Create a report so we can check the log
    await reportUser(
        challengerPage,
        "e2egamesBasicA", // cspell:disable-line
        "score_cheating",
        "E2E test reporting a score cheat",
    );
};
