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

/*
 * Scoring a game, end to end: the players pass, the server proposes the dead
 * stones, a player marks one alive by hand and the Auto-score button marks it
 * dead again, both accept, and the game log records each step.
 *
 * One game carries all of these checks. They are successive phases of the
 * same position, and every game that enters stone removal costs the e2e
 * stack a KataGo request: three games doing so together, in three separate
 * tests, made all three tests flaky.
 *
 * The players' browsers do not score the game themselves:
 *  - the local WASM estimator is kept from loading, so the client's 15 s
 *    fallback never pre-empts the server's proposal (a client result applied
 *    first makes the server drop its proposal), and
 *  - the Auto-score button's call to ai-term is answered by the test with the
 *    answer ai-term returned for this position in a real run, so the button is
 *    checked independent of scorer speed (goban abandons the call at 30 s).
 * The server's proposal is the real scorer in this game.
 *
 * Uses init_e2e data:
 *  - E2E_MODERATOR : opens the game log
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, Page, TestInfo, expect } from "@playwright/test";
import {
    generateUniqueTestIPv6,
    loginAsUser,
    newTestUsername,
    prepareNewUser,
    turnOffDynamicHelp,
} from "@helpers/user-utils";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { clickOnGobanIntersection, playMoves, waitForGameFinished } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";

/**
 * ai-term's answer for the position below, as it returned it in a real run:
 * columns A-D are black's, E-J white's, and white's stone at B5 (x=1, y=4)
 * is dead. The button applies autoscored_removed (ScoreEstimator's
 * getProbablyDead) and autoscored_board_state; the rest is what ai-term sends
 * alongside.
 */
const SCORER_ANSWER = {
    autoscored_board_state: Array.from({ length: 9 }, () => [1, 1, 1, 1, 2, 2, 2, 2, 2]),
    autoscored_removed: [
        { x: 1, y: 4, removal_reason: "both players agree this is captured by black" },
    ],
    autoscored_needs_sealing: [],
    score: -17.07,
    win_rate: 0.00085,
    ownership: Array.from({ length: 9 }, () => [1, 1, 1, 1, -1, -1, -1, -1, -1]),
    recommended_moves: { black: { x: 7, y: 4 }, white: { x: -1, y: -1 } },
};

/** Whether B5 (x=1, y=4 on a 9x9) is marked dead on this page's board. */
const b5MarkedDead = (page: Page) =>
    page.evaluate(() => {
        const engine = (window as any).global_goban?.engine;
        return engine ? !!engine.removal[4][1] : null;
    });

/** As b5MarkedDead, but null until the server's proposal has landed. */
const b5MarkedDeadByProposal = (page: Page) =>
    page.evaluate(() => {
        const engine = (window as any).global_goban?.engine;
        return engine?.auto_scoring_done ? !!engine.removal[4][1] : null;
    });

export const scoringTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    _testInfo: TestInfo,
) => {
    // With its script blocked, a fallback run (a proposal later than 15 s)
    // waits forever for the estimator to load: "Scoring game" stays up and
    // the goban's "Processing..." message covers the board. That is harmless
    // here, see the hand mark below. A stand-in script is no better: goban's
    // estimator returns an all-zero ownership for any module that fails,
    // which the fallback would apply as every stone dead.
    const createPlayerContext = async (options?: CreateContextOptions) => {
        const context = await createContext(options);
        await context.route("**/OGSScoreEstimator/**", (route) => route.abort());
        await context.route("**/api/score", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(SCORER_ANSWER),
            }),
        );
        return context;
    };

    const { userPage: blackPage } = await prepareNewUser(
        createPlayerContext,
        newTestUsername("ScoringB"), // cspell:disable-line
        "test",
    );
    const whiteUsername = newTestUsername("ScoringW"); // cspell:disable-line
    const { userPage: whitePage } = await prepareNewUser(
        createPlayerContext,
        whiteUsername,
        "test",
    );

    await createDirectChallenge(blackPage, whiteUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E Scoring Test Game",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "300",
        timePerPeriod: "30",
        periods: "5",
        ranked: false,
    });
    await acceptDirectChallenge(whitePage, blackPage);

    // Two walls split the board; white's last stone at B5 is dead inside
    // black's area, so the scorers have a stone to mark.
    const moves = [
        "D9",
        "E9",
        "D8",
        "E8",
        "D7",
        "E7",
        "D6",
        "E6",
        "D5",
        "E5",
        "D4",
        "E4",
        "D3",
        "E3",
        "D2",
        "E2",
        "D1",
        "E1",
        "A1",
        "B5",
    ];
    await playMoves(blackPage, whitePage, moves, "9x9");

    for (const page of [blackPage, whitePage]) {
        await expect(page.getByText(/^Your move(?: - opponent passed)?$/)).toBeVisible();
        await (await expectOGSClickableByName(page, /^Pass$/)).click();
    }

    // The server's proposal lands on both boards as the stone removal state,
    // with B5 dead.
    await Promise.all(
        [blackPage, whitePage].map(async (page) => {
            await expect(page.locator(".stone-removal-buttons")).toBeVisible();
            await expect.poll(() => b5MarkedDeadByProposal(page), { timeout: 90000 }).toBe(true);
        }),
    );
    // Black marks B5 alive by hand; Auto-score marks it dead again with the
    // browser's own scorer call (answered by the stub), not the server's
    // proposal. No wait for "Scoring game" to clear first: a hung fallback
    // run keeps it up, with its message over the board, until the button's
    // own run replaces it. The click still lands, as the goban's pointer
    // handlers are on the board's container and read the position from the
    // event.
    await clickOnGobanIntersection(blackPage, "B5", "9x9");
    await expect.poll(() => b5MarkedDead(blackPage)).toBe(false);
    await (await expectOGSClickableByName(blackPage, /^Auto-score$/)).click();
    await expect.poll(() => b5MarkedDead(blackPage), { timeout: 15000 }).toBe(true);
    await expect.poll(() => b5MarkedDead(whitePage), { timeout: 15000 }).toBe(true);

    // Both accept and the game ends.
    await (await expectOGSClickableByName(whitePage, /^Accept removed stones/)).click();
    await expect(blackPage.locator(".white .stone-removal-accepted.accepted")).toBeVisible();
    await (await expectOGSClickableByName(blackPage, /^Accept removed stones/)).click();
    await Promise.all(
        [blackPage, whitePage].map((page) => expect(page.getByText("wins by")).toBeVisible()),
    );
    await waitForGameFinished(blackPage);
    const gameUrl = blackPage.url();

    // The game log has an entry per step: the server's proposal, the button's
    // update, both acceptances and the end of the game.
    const moderatorPassword = process.env.E2E_MODERATOR_PASSWORD;
    if (!moderatorPassword) {
        throw new Error("E2E_MODERATOR_PASSWORD environment variable must be set");
    }
    const modContext = await createContext({
        extraHTTPHeaders: { "X-Forwarded-For": generateUniqueTestIPv6() },
    });
    const modPage = await modContext.newPage();
    await loginAsUser(modPage, "E2E_MODERATOR", moderatorPassword);
    await turnOffDynamicHelp(modPage);
    await modPage.goto(gameUrl);
    await expect(modPage.locator(".Game")).toBeVisible({ timeout: 15000 });

    await (await expectOGSClickableByName(modPage, "Game log")).click();
    await expect(modPage.locator("table.GameLog")).toBeVisible();

    const entries = modPage.locator(".GameLog tr.entry");
    const events = entries.locator("td.event");
    await expect(events.filter({ hasText: "server autoscore" })).toHaveCount(1);
    await expect(entries.filter({ hasText: "server autoscore" })).toContainText(
        "stones marked dead",
    );
    await expect(
        entries
            .filter({ hasText: "stone removal stones set" })
            .filter({ hasText: "auto-scorer update" }),
    ).toHaveCount(1);
    await expect(events.filter({ hasText: "stone removal stones accepted" })).toHaveCount(2);
    await expect(events.filter({ hasText: "game ended" })).toHaveCount(1);
};
