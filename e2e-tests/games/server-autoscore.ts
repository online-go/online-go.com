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
 * The server proposes the dead stones when a game enters stone removal, and
 * the players' browsers do not score the game themselves.
 *
 * Uses init_e2e data:
 *  - E2E_MODERATOR : opens the game log
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, TestInfo, expect } from "@playwright/test";
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
import { playMoves, waitForGameFinished } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";

export const serverAutoscoreTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    _testInfo: TestInfo,
) => {
    const { userPage: blackPage } = await prepareNewUser(
        createContext,
        newTestUsername("SrvScoreB"), // cspell:disable-line
        "test",
    );
    const whiteUsername = newTestUsername("SrvScoreW"); // cspell:disable-line
    const { userPage: whitePage } = await prepareNewUser(createContext, whiteUsername, "test");

    await createDirectChallenge(blackPage, whiteUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E Server Autoscore Test Game",
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
    // black's area, so the proposal has a stone to mark.
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

    // This test is about the server's proposal. The dev stack's CPU KataGo
    // can take longer than the client's 15 s fallback to produce it, and a
    // client that scores first makes the server drop its proposal, so keep
    // the browsers' own scorer calls from going out. (They would fail
    // anyway: ai-term's CORS allow-list rejects the e2e X-Forwarded-For
    // header. Blocking them here keeps the test honest if that changes.)
    for (const page of [blackPage, whitePage]) {
        await page.route("**/api/score", (route) => route.abort());
    }

    for (const page of [blackPage, whitePage]) {
        await expect(page.getByText(/^Your move(?: - opponent passed)?$/)).toBeVisible();
        await (await expectOGSClickableByName(page, /^Pass$/)).click();
    }

    // The server's proposal lands on both boards as the stone removal state.
    // Wait on the client state rather than the "Scoring game" indicator, and
    // check its content: B5 (x=1, y=4) is the dead white stone.
    await Promise.all(
        [blackPage, whitePage].map(async (page) => {
            await expect(page.locator(".stone-removal-buttons")).toBeVisible();
            await expect
                .poll(
                    () =>
                        page.evaluate(() => {
                            const engine = (window as any).global_goban?.engine;
                            return engine?.auto_scoring_done ? engine.removal[4][1] : null;
                        }),
                    { timeout: 90000 },
                )
                .toBe(true);
        }),
    );

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

    const events = modPage.locator(".GameLog tr.entry td.event");
    await expect(events.filter({ hasText: "server autoscore" })).toHaveCount(1);
    await expect(
        modPage.locator(".GameLog tr.entry").filter({ hasText: "server autoscore" }),
    ).toContainText("stones marked dead");
};
