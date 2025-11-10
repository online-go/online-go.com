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
import { playMoves } from "@helpers/game-utils";

export const runGame = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { userPage: challengerPage } = await prepareNewUser(
        createContext,
        newTestUsername("e2eUtilsRGCh"), // cspell:disable-line
        "test",
    );

    const acceptorUsername = newTestUsername("e2eUtilsRGAc"); // cspell:disable-line
    const { userPage: acceptorPage } = await prepareNewUser(
        createContext,
        acceptorUsername,
        "test",
    );

    const boardSize = "19x19"; // needed in two places
    const handicap = 0; // also needed in two places

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
        handicap: handicap.toString(),
    });

    // escaper accepts
    await acceptDirectChallenge(acceptorPage);

    // Challenger is black
    // Wait for the Goban to be visible & definitely ready
    const goban = challengerPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    await challengerPage.waitForTimeout(1000);

    // ** Make sure you have set the board size above to match the moves below! **

    //const moves = ["D17", "K11", "Q17", "M10", "D3", "J8"];

    // const moves = ["A19", "T19", "A1", "T1", "D16", "Q16", "K10", "Q4", "D4", "Q10", "D10", "K19"];

    const moves = [
        "P4", // B[pd]
        "D3", // W[dc]
        "Q16", // B[qp]
        "D16", // W[dq]
        "N16", // B[np]
        "P16", // W[pp]
        "P15", // B[pq]
        "Q15", // W[qq]
        "Q14", // B[qo]
        "O15", // W[oq]
        "P17", // B[pr]
        "O16", // W[op]
        "O17", // B[or]
        "N15", // W[nq]
        "N17", // B[nr]
        "M15", // W[mq]
        "N14", // B[no]
        "O13", // W[on]
        "Q12", // B[qm]
        "P13", // W[pn]
        "Q13", // B[qn]
        "M17", // W[mr]
        "R15", // B[rq]
        "J16", // W[jp]
        "C5", // B[ce]
        "E4", // W[ed]
        "C9", // B[ci]
        "C11", // W[ck]
        "B3", // B[bc]
        "C6", // W[cf]
        "D6", // B[df]
        "C4", // W[cd]
        "B6", // B[bf]
        "B4", // W[bd]
        "C7", // B[cg]
        "N3", // W[nc]
        "P6", // B[pf]
        "K4", // W[kd]
        "C14", // B[co]
        "C16", // W[cp]
        "D14", // B[do]
        "F15", // W[fq]
        "C12", // B[cm]
        "P3", // W[pc]
        "Q3", // B[qc]
        "Q2", // W[qb]
        "O3", // B[oc]
        "P2", // W[pb]
        "O2", // B[ob]
        "O4", // W[od]
        "N2", // B[nb]
        "Q4", // W[qd]
        "P5", // B[pe]
        "R3", // W[rc]
        "M3", // B[mc]
        "J3", // W[ic]
        "R5", // B[re]
        "R4", // W[rd]
        "P10", // B[pj]
        "N11", // W[nl]
        "H15", // B[hq]
        "F14", // W[fo]
        "J11", // B[jq]
        "J18", // W[ip]
        "J17", // B[iq]
        "K16", // W[kp]
        "H16", // B[hp]
        "J13", // W[in]
        "H14", // B[ho]
        "H13", // W[hn]
        "F17", // B[fr]
        "E17", // W[er]
        "G17", // B[gr]
        "E12", // W[em]
        "D11", // B[dk]
        "D10", // W[dj]
        "D12", // B[dl]
        "C10", // W[cj]
        "F11", // B[fk]
        "D9", // W[di]
        "B9", // B[bi]
        "F9", // W[fi]
    ];

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
};
