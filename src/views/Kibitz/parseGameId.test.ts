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

import { parseKibitzBoardInput } from "./parseGameId";

describe("parseKibitzBoardInput", () => {
    test.each([
        ["12345", { game_id: 12345 }],
        ["https://online-go.com/game/12345", { game_id: 12345 }],
        ["https://online-go.com/game/view/12345", { game_id: 12345 }],
        ["https://online-go.com/review/678", { review_id: 678 }],
        ["https://online-go.com/review/view/678", { review_id: 678 }],
        ["https://online-go.com/review/678/42", { review_id: 678 }],
        ["https://online-go.com/demo/678", { review_id: 678 }],
        ["/demo/view/678?x=1", { review_id: 678 }],
    ])("reads %s", (input, expected) => {
        expect(parseKibitzBoardInput(input)).toEqual(expected);
    });

    test.each(["", "abc", "https://online-go.com/player/5"])("rejects %p", (input) => {
        expect(parseKibitzBoardInput(input)).toBeNull();
    });
});
