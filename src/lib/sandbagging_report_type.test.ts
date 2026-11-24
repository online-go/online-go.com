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

import { accusedLostFinishedGame, sandbaggingReportType } from "@/lib/sandbagging_report_type";

import type { Gamedata } from "@/lib/report_checklist";

const BLACK = 7;
const WHITE = 99;

const game = (over: Partial<Gamedata> = {}): Gamedata => ({
    outcome: "Resignation",
    winner: WHITE,
    phase: "finished",
    moves: [1, 2, 3],
    black_player_id: BLACK,
    white_player_id: WHITE,
    ...over,
});

describe("accusedLostFinishedGame", () => {
    test("the loser of a finished game lost it", () => {
        expect(accusedLostFinishedGame(game(), BLACK)).toBe(true);
    });

    test("the winner did not lose", () => {
        expect(accusedLostFinishedGame(game(), WHITE)).toBe(false);
    });

    test("nobody has lost a game still in progress, whatever the payload says", () => {
        expect(accusedLostFinishedGame(game({ phase: "play" }), BLACK)).toBe(false);
    });

    test("someone who did not play in the game did not lose it", () => {
        expect(accusedLostFinishedGame(game(), 12345)).toBe(false);
    });

    test("a cancelled game is lost by the canceller: the outcome text is not consulted", () => {
        expect(accusedLostFinishedGame(game({ outcome: "Cancellation" }), BLACK)).toBe(true);
    });

    test("a payload without a winner is not a loss", () => {
        const no_winner = game({ winner: undefined as unknown as number });
        expect(accusedLostFinishedGame(no_winner, BLACK)).toBe(false);
    });
});

describe("sandbaggingReportType", () => {
    test("thrown game when the accused lost", () => {
        expect(sandbaggingReportType(game(), BLACK)).toBe("thrown_game");
    });

    test("assessment when the accused won", () => {
        expect(sandbaggingReportType(game(), WHITE)).toBe("sandbagging_assessment");
    });

    test("assessment without game data", () => {
        expect(sandbaggingReportType(undefined, BLACK)).toBe("sandbagging_assessment");
    });

    test("assessment without an accused", () => {
        expect(sandbaggingReportType(game(), undefined)).toBe("sandbagging_assessment");
    });
});
