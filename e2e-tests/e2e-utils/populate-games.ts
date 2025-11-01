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

// Utility to populate game history by playing the same game multiple times

import { Browser, Page, expect } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves } from "@helpers/game-utils";
import { sgfToDisplay } from "@helpers/sgf-utils";

async function playOneGame(
    player1Page: Page,
    player2Page: Page,
    player1Username: string,
    player2Username: string,
    gameNumber: number,
) {
    const boardSize = "19x19";
    const handicap = 0;

    // Alternate who challenges: odd games player1 challenges, even games player2 challenges
    const isPlayer1Black = gameNumber % 2 === 1;
    const challengerPage = isPlayer1Black ? player1Page : player2Page;
    const acceptorPage = isPlayer1Black ? player2Page : player1Page;
    const acceptorUsername = isPlayer1Black ? player2Username : player1Username;

    // Challenger challenges the acceptor
    await createDirectChallenge(challengerPage, acceptorUsername, {
        ...defaultChallengeSettings,
        gameName: `E2E Populated Game ${gameNumber}`,
        boardSize: boardSize,
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "45",
        timePerPeriod: "10",
        periods: "1",
        handicap: handicap.toString(),
    });

    // Acceptor accepts
    await acceptDirectChallenge(acceptorPage);

    // Wait for the Goban to be visible & definitely ready
    const goban = challengerPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    await challengerPage.waitForTimeout(1000);

    const sgfMoves = [
        "pc", // B[pc]
        "dp", // W[dp]
        "po", // B[po]
        "dd", // W[dd]
        "cc", // B[cc]
        "cd", // W[cd]
        "dc", // B[dc]
        "ed", // W[ed]
        "ec", // B[ec]
        "fc", // W[fc]
        "fb", // B[fb]
        "pe", // W[pe]
        "qe", // B[qe]
        "qf", // W[qf]
        "qd", // B[qd]
        "pf", // W[pf]
        "nc", // B[nc]
        "pq", // W[pq]
        "mp", // B[mp]
        "qo", // W[qo]
        "qp", // B[qp]
        "pp", // W[pp]
        "qq", // B[qq]
        "qr", // W[qr]
        "rr", // B[rr]
        "pr", // W[pr]
        "ro", // B[ro]
        "qn", // W[qn]
        "rn", // B[rn]
        "oo", // W[oo]
        "ql", // B[ql]
        "pn", // W[pn]
        "pi", // B[pi]
        "od", // W[od]
        "mb", // B[mb]
        "mf", // W[mf]
        "cq", // B[cq]
        "cp", // W[cp]
        "dq", // B[dq]
        "ep", // W[ep]
        "fr", // B[fr]
        "dj", // W[dj]
        "gq", // B[gq]
        "gc", // W[gc]
        "gb", // B[gb]
        "hc", // W[hc]
        "dl", // B[dl]
        "go", // W[go]
        "fl", // B[fl]
        "fj", // W[fj]
        "hl", // B[hl]
        "io", // W[io]
        "jq", // B[jq]
        "em", // W[em]
        "el", // B[el]
        "dm", // W[dm]
        "cm", // B[cm]
        "cl", // W[cl]
        "ck", // B[ck]
        "bl", // W[bl]
        "cn", // B[cn]
        "bk", // W[bk]
        "cj", // B[cj]
        "ci", // W[ci]
        "bj", // B[bj]
        "bi", // W[bi]
        "dk", // B[dk]
        "aj", // W[aj]
        "ej", // B[ej]
        "di", // W[di]
        "ei", // B[ei]
        "eh", // W[eh]
        "fi", // B[fi]
        "fh", // W[fh]
        "gi", // B[gi]
        "bd", // W[bd]
        "dh", // B[dh]
        "cg", // W[cg]
        "dg", // B[dg]
        "df", // W[df]
        "gh", // B[gh]
        "eg", // W[eg]
        "bc", // B[bc]
        "fm", // W[fm],
    ];

    // Convert SGF coordinates to display format
    const moves = sgfMoves.map(sgfToDisplay);

    await playMoves(challengerPage, acceptorPage, moves, boardSize, handicap);

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
}

export const populateGames = async ({ browser }: { browser: Browser }) => {
    const player1Username = newTestUsername("e2ePopPlayer1");
    const { userPage: player1Page } = await prepareNewUser(browser, player1Username, "test");

    const player2Username = newTestUsername("e2ePopPlayer2");
    const { userPage: player2Page } = await prepareNewUser(browser, player2Username, "test");

    const numberOfGames = 5;

    for (let i = 1; i <= numberOfGames; i++) {
        await playOneGame(player1Page, player2Page, player1Username, player2Username, i);
    }
};
