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
import { expectOGSClickableByName } from "@helpers/matchers";

const undoEngineState = (page: Page) =>
    page.evaluate(() => {
        const engine = window.global_goban?.engine;
        return {
            undo_requested_move_count: engine?.undo_requested_move_count,
            stone_count: engine?.getUndoRequestStones().length,
            cur_move_number: engine?.cur_move?.move_number,
        };
    });

/** Locate visible undo marks, including those inside the board's shadow root. */
const renderedUndoMarks = (page: Page) =>
    page.locator("svg text", { hasText: "↶" }).filter({ visible: true });

async function requestAndAcceptTwoMoveUndo(
    requester: Page,
    opponent: Page,
    expectedMoveNumber: number,
) {
    await Promise.all(
        [requester, opponent].map((page) =>
            expect(page.locator(".MoveNumberControl-move-number")).toHaveText(
                `Move ${expectedMoveNumber + 2}`,
            ),
        ),
    );
    await expect(requester.getByText("Your move", { exact: true })).toBeVisible();
    const moreActions = requester.locator('button.GobanView-tab-button[title="More actions"]');
    await expect(moreActions).toBeOGSClickable();
    await moreActions.click();
    await (await expectOGSClickableByName(requester, "Request undo")).click();
    const acceptUndo = await expectOGSClickableByName(opponent, "Accept Undo");

    await Promise.all(
        [requester, opponent].map(async (page) => {
            await expect
                .poll(() => undoEngineState(page))
                .toMatchObject({
                    undo_requested_move_count: 2,
                    stone_count: 2,
                    cur_move_number: expectedMoveNumber + 2,
                });
            await expect(renderedUndoMarks(page)).toHaveCount(2);
        }),
    );

    await acceptUndo.click();
    await Promise.all(
        [requester, opponent].map(async (page) => {
            // A two-move undo preserves the turn, so its label cannot confirm completion.
            await expect(page.locator(".MoveNumberControl-move-number")).toHaveText(
                `Move ${expectedMoveNumber}`,
            );
            await expect
                .poll(() => undoEngineState(page))
                .toMatchObject({
                    cur_move_number: expectedMoveNumber,
                    stone_count: 0,
                });
            await expect(renderedUndoMarks(page)).toHaveCount(0);
        }),
    );
}

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
        mainTime: "300",
        timePerPeriod: "30",
        periods: "5",
    });
    await acceptDirectChallenge(acceptorPage);

    // Challenger is black. Black plays, white answers — black's turn again.
    await playMoves(challengerPage, acceptorPage, ["D4", "E5"], "9x9");

    await requestAndAcceptTwoMoveUndo(challengerPage, acceptorPage, 0);
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
        mainTime: "300",
        timePerPeriod: "30",
        periods: "5",
    });
    await acceptDirectChallenge(acceptorPage);

    // Three moves: B D4, W E5, B C3 — now it is white's turn.
    await playMoves(challengerPage, acceptorPage, ["D4", "E5", "C3"], "9x9");

    await requestAndAcceptTwoMoveUndo(acceptorPage, challengerPage, 1);
};
