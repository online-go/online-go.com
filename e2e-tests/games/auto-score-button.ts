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
 * The "Auto-score" button runs the browser's own scoring: it asks ai-term
 * for the dead stones and marks them. A player un-marks the dead stone by
 * hand, presses Auto-score, and the stone is marked dead again.
 *
 * ai-term's answer is served by the test, not by ai-term. Its KataGo is
 * shared with the server's proposals and the other scoring tests, and in the
 * parallel run the real call took 32-47 s against the 30 s the browser waits
 * (goban runStoneRemovalAutoScoring), so this test failed on scorer speed,
 * not on the button. The server-proposal test keeps the real scorer covered;
 * this one covers the button: the request it sends, the marks it applies,
 * the update it sends the server, and the game log entry.
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

/** Whether B5 (x=1, y=4 on a 9x9) is marked dead on this page's board. */
const b5MarkedDead = (page: Page) =>
    page.evaluate(() => {
        const engine = (window as any).global_goban?.engine;
        return engine ? !!engine.removal[4][1] : null;
    });

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

export const autoScoreButtonTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    _testInfo: TestInfo,
) => {
    // Both players' browsers get the canned answer, whichever of them the
    // button's scoring runs in. The route matches ai-term's /api/score only;
    // the client's own fallback scorer is local WASM and never calls it.
    const createContextWithStubbedScorer = async (options?: CreateContextOptions) => {
        const context = await createContext(options);
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
        createContextWithStubbedScorer,
        newTestUsername("AutoScoreB"), // cspell:disable-line
        "test",
    );
    const whiteUsername = newTestUsername("AutoScoreW"); // cspell:disable-line
    const { userPage: whitePage } = await prepareNewUser(
        createContextWithStubbedScorer,
        whiteUsername,
        "test",
    );

    await createDirectChallenge(blackPage, whiteUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E Auto-score Button Test Game",
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
    // black's area.
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

    // Let the initial scoring settle (the server's proposal, or the client's
    // own fallback) so the manual click below is not raced by it.
    await expect(blackPage.locator(".stone-removal-buttons")).toBeVisible();
    await expect.poll(() => b5MarkedDead(blackPage), { timeout: 90000 }).toBe(true);
    await expect(blackPage.locator(".autoscoring-in-progress")).toBeHidden({ timeout: 30000 });

    // Black marks B5 alive by hand.
    await clickOnGobanIntersection(blackPage, "B5", "9x9");
    await expect.poll(() => b5MarkedDead(blackPage)).toBe(false);

    // Auto-score marks it dead again: the browser's own scorer call (answered
    // by the stub above), not the server's proposal.
    await (await expectOGSClickableByName(blackPage, /^Auto-score$/)).click();
    await expect.poll(() => b5MarkedDead(blackPage), { timeout: 60000 }).toBe(true);
    await expect.poll(() => b5MarkedDead(whitePage), { timeout: 10000 }).toBe(true);

    await (await expectOGSClickableByName(whitePage, /^Accept removed stones/)).click();
    await expect(blackPage.locator(".white .stone-removal-accepted.accepted")).toBeVisible();
    await (await expectOGSClickableByName(blackPage, /^Accept removed stones/)).click();
    await Promise.all(
        [blackPage, whitePage].map((page) => expect(page.getByText("wins by")).toBeVisible()),
    );
    await waitForGameFinished(blackPage);
    const gameUrl = blackPage.url();

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

    // The button's scoring is logged as the browser's own stone removal
    // update, labelled as an auto-scorer update.
    const autoScorerRows = modPage
        .locator(".GameLog tr.entry")
        .filter({ hasText: "stone removal stones set" })
        .filter({ hasText: "auto-scorer update" });
    await expect(autoScorerRows.first()).toBeVisible();
};
