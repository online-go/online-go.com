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

import type { CreateContextOptions } from "@helpers";

import { BrowserContext } from "@playwright/test";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves } from "@helpers/game-utils";

const undoEngineState = (page: Page) =>
    page.evaluate(() => {
        const engine = (window as any).goban_controller?.goban?.engine;
        return {
            undo_requested: engine?.undo_requested,
            undo_requested_by: engine?.undo_requested_by,
            undo_requested_move_count: engine?.undo_requested_move_count,
            stones: engine?.getUndoRequestStones?.(),
            cur_move_number: engine?.cur_move?.move_number,
        };
    });

/* The goban renders into a shadow root, so count marks with a Playwright
 * locator (which pierces shadow DOM), not document.querySelectorAll. */
const renderedUndoMarkCount = (page: Page) => page.locator("svg text", { hasText: "↶" }).count();

/**
 * Requesting an undo while it is the requester's own turn must cover the
 * last TWO moves (the opponent's answer plus the requester's own move), and
 * accepting must roll both boards back both moves.
 */
export const multiMoveUndoTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { userPage: challengerPage } = await prepareNewUser(
        createContext,
        newTestUsername("undo2B"), // cspell:disable-line
        "test",
    );
    const acceptorUsername = newTestUsername("undo2W"); // cspell:disable-line
    const { userPage: acceptorPage } = await prepareNewUser(
        createContext,
        acceptorUsername,
        "test",
    );

    await createDirectChallenge(challengerPage, acceptorUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E multi-move undo",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "45",
        timePerPeriod: "10",
        periods: "1",
    });
    await acceptDirectChallenge(acceptorPage);

    // Challenger is black. Black plays, white answers — black's turn again.
    await playMoves(challengerPage, acceptorPage, ["D4", "E5"], "9x9");

    // Black requests an undo while it is black's turn.
    const undoButton = challengerPage.getByTitle("Request undo");
    await expect(undoButton).toBeEnabled();
    await undoButton.click();

    // The opponent sees a request covering both moves...
    await expect(acceptorPage.getByText("Accept Undo")).toBeVisible({ timeout: 10000 });
    const seen_by_white = await undoEngineState(acceptorPage);
    expect(seen_by_white.undo_requested_move_count).toBe(2);
    expect(seen_by_white.stones).toHaveLength(2);

    // ...and both boards mark both stones.
    expect(await renderedUndoMarkCount(acceptorPage)).toBe(2);
    expect(await renderedUndoMarkCount(challengerPage)).toBe(2);

    // White accepts — both boards roll back both moves (to move 0).
    await acceptorPage.getByText("Accept Undo").click();
    await expect(challengerPage.getByText("Your move", { exact: true })).toBeVisible({
        timeout: 10000,
    });
    expect((await undoEngineState(challengerPage)).cur_move_number).toBe(0);
    expect((await undoEngineState(acceptorPage)).cur_move_number).toBe(0);
};

/**
 * The same two-move request must work when WHITE is the requester (parity
 * check on the server's player-to-move computation).
 */
export const multiMoveUndoWhiteRequesterTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { userPage: challengerPage } = await prepareNewUser(
        createContext,
        newTestUsername("undo2WrB"), // cspell:disable-line
        "test",
    );
    const acceptorUsername = newTestUsername("undo2WrW"); // cspell:disable-line
    const { userPage: acceptorPage } = await prepareNewUser(
        createContext,
        acceptorUsername,
        "test",
    );

    await createDirectChallenge(challengerPage, acceptorUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E multi-move undo white",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "45",
        timePerPeriod: "10",
        periods: "1",
    });
    await acceptDirectChallenge(acceptorPage);

    // Three moves: B D4, W E5, B C3 — now it is white's turn.
    await playMoves(challengerPage, acceptorPage, ["D4", "E5", "C3"], "9x9");

    const undoButton = acceptorPage.getByTitle("Request undo");
    await expect(undoButton).toBeEnabled();
    await undoButton.click();

    await expect(challengerPage.getByText("Accept Undo")).toBeVisible({ timeout: 10000 });
    const seen_by_black = await undoEngineState(challengerPage);
    expect(seen_by_black.undo_requested_move_count).toBe(2);
    expect(seen_by_black.stones).toHaveLength(2);
};
