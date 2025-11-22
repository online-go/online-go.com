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

// Test that plays the game from SGF: 81401154-169-けんのまる-Simons127.sgf

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, expect } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves } from "@helpers/game-utils";
import { sgfToDisplay } from "@helpers/sgf-utils";

export const runSgfGame = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { userPage: challengerPage } = await prepareNewUser(
        createContext,
        newTestUsername("e2eSGFBlack"),
        "test",
    );

    const acceptorUsername = newTestUsername("e2eSGFWhite");
    const { userPage: acceptorPage } = await prepareNewUser(
        createContext,
        acceptorUsername,
        "test",
    );

    const boardSize = "19x19";
    const handicap = 0;

    // Challenger challenges the acceptor
    await createDirectChallenge(challengerPage, acceptorUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E SGF Game - Seoul Fuseki vs serwer",
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
        "qd", // B[qd]
        "dp", // W[dp]
        "pq", // B[pq]
        "dd", // W[dd]
        "fc", // B[fc]
        "jd", // W[jd]
        "cc", // B[cc]
        "dc", // W[dc]
        "cd", // B[cd]
        "de", // W[de]
        "db", // B[db]
        "eb", // W[eb]
        "cb", // B[cb]
        "fb", // W[fb]
        "cf", // B[cf]
        "gc", // W[gc]
        "nc", // B[nc]
        "po", // W[po]
        "qo", // B[qo]
        "qn", // W[qn]
        "qp", // B[qp]
        "pn", // W[pn]
        "nq", // B[nq]
        "pj", // W[pj]
        "cq", // B[cq]
        "dq", // W[dq]
        "cp", // B[cp]
        "do", // W[do]
        "co", // B[co]
        "cn", // W[cn]
        "bn", // B[bn]
        "jp", // W[jp]
        "qh", // B[qh]
        "oh", // W[oh]
        "cm", // B[cm]
        "dn", // W[dn]
        "cr", // B[cr]
        "el", // W[el]
        "df", // B[df]
        "ef", // W[ef]
        "eg", // B[eg]
        "fg", // W[fg]
        "eh", // B[eh]
        "fh", // W[fh]
        "ei", // B[ei]
        "fi", // W[fi]
        "ej", // B[ej]
        "fj", // W[fj]
        "pf", // B[pf]
        "pp", // W[pp]
        "qq", // B[qq]
        "mp", // W[mp]
        "np", // B[np]
        "mo", // W[mo]
        "no", // B[no]
        "nn", // W[nn]
        "mn", // B[mn]
        "nm", // W[nm]
        "mq", // B[mq]
        "ko", // W[ko]
        "ng", // B[ng]
        "nh", // W[nh]
        "mg", // B[mg]
        "mh", // W[mh]
        "lg", // B[lg]
        "lh", // W[lh]
        "kg", // B[kg]
        "kh", // W[kh]
        "hc", // B[hc]
        "hd", // W[hd]
        "gd", // B[gd]
        "gb", // W[gb]
        "id", // B[id]
        "he", // W[he]
        "ie", // B[ie]
        "ic", // W[ic]
        "jc", // B[jc]
        "hb", // W[hb]
        "jb", // B[jb]
        "qc", // W[qc]
        "rd", // B[rd]
        "mc", // W[mc]
        "kd", // B[kd]
        "nb", // W[nb]
        "oc", // B[oc]
        "if", // W[if]
        "je", // B[je]
        "cl", // W[cl]
        "dm", // B[dm]
        "em", // W[em]
        "bm", // B[bm]
        "kq", // W[kq]
        "er", // B[er]
        "dr", // W[dr]
        "ds", // B[ds]
        "fq", // W[fq]
        "eq", // B[eq]
        "ep", // W[ep]
        "fr", // B[fr]
        "gq", // W[gq]
        "gr", // B[gr]
        "hq", // W[hq]
        "ek", // B[ek]
        "fk", // W[fk]
        "dl", // B[dl]
        "ri", // W[ri]
        "jg", // B[jg]
        "ih", // W[ih]
        "qi", // B[qi]
        "qj", // W[qj]
        "rh", // B[rh]
        "rj", // W[rj]
        "hr", // B[hr]
        "ir", // W[ir]
        "jr", // B[jr]
        "iq", // W[iq]
        "lq", // B[lq]
        "lp", // W[lp]
        "kr", // B[kr]
        "hs", // W[hs]
        "ce", // B[ce]
        "gs", // W[gs]
        "es", // B[es]
        "ff", // W[ff]
        "ig", // B[ig]
        "hg", // W[hg]
        "jh", // B[jh]
        "ji", // W[ji]
        "rn", // B[rn]
        "rm", // W[rm]
        "ro", // B[ro]
        "og", // W[og]
        "of", // B[of]
        "sh", // W[sh]
        "sg", // B[sg]
        "pg", // W[pg]
        "qg", // B[qg]
        "si", // W[si]
        "sm", // B[sm]
        "rl", // W[rl]
        "ib", // B[ib]
        "ia", // W[ia]
        "ja", // B[ja]
        "ha", // W[ha]
        "pi", // B[pi]
        "oi", // W[oi]
        "jf", // B[jf]
        "hf", // W[hf]
        "qf", // B[qf]
        "da", // W[da]
        "ca", // B[ca]
        "ea", // W[ea]
        "oo", // B[oo]
        "on", // W[on]
        "sl", // B[sl]
        "sk", // W[sk]
        "sn", // B[sn]
        "op", // W[op]
        "oq", // B[oq]
        "jq", // W[jq]
        "js", // B[js]
        "is", // W[is]
        "lr", // B[lr]
        "hc", // W[hc]
        "cs", // B[cs]
        "ph", // W[ph]
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
};
