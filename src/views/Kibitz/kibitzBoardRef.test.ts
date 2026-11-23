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

import { boardKey, gobanBoardKey, sameBoard } from "./kibitzBoardRef";

describe("kibitzBoardRef", () => {
    it("does not take a game and a review with the same id for the same board", () => {
        expect(sameBoard({ game_id: 12 }, { review_id: 12 })).toBe(false);
        expect(sameBoard({ review_id: 12 }, { review_id: 12 })).toBe(true);
    });

    it("takes a review of a game for the review, not the game", () => {
        expect(boardKey({ game_id: 5, review_id: 9 })).toBe("review:9");
    });

    it("does not match two things that name no board", () => {
        expect(sameBoard({}, { game_id: 0 })).toBe(false);
    });

    it("reads a review goban, whose game id is 0, as the review", () => {
        expect(gobanBoardKey({ game_id: 0, review_id: 9 })).toBe("review:9");
        expect(gobanBoardKey({ game_id: 4, review_id: 0 })).toBe("game:4");
    });
});
