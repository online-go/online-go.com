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

import { Goban } from "goban";
import { user_color } from "./util";

function fakeGoban(opts: {
    black_id: number;
    white_id: number;
    rengo?: boolean;
    rengo_teams?: { black: Array<{ id: number }>; white: Array<{ id: number }> };
}): Goban {
    const engine = {
        playerColor: (id: number): "black" | "white" | "invalid" =>
            id === opts.black_id ? "black" : id === opts.white_id ? "white" : "invalid",
        rengo: opts.rengo ?? false,
        rengo_teams: opts.rengo_teams,
    };
    return { engine } as unknown as Goban;
}

describe("user_color", () => {
    test("returns the seat color for a player", () => {
        const goban = fakeGoban({ black_id: 1, white_id: 2 });
        expect(user_color(goban, 1)).toBe("black");
        expect(user_color(goban, 2)).toBe("white");
    });

    test("returns null for a spectator", () => {
        const goban = fakeGoban({ black_id: 1, white_id: 2 });
        expect(user_color(goban, 99)).toBeNull();
    });

    test("finds rengo team members", () => {
        const goban = fakeGoban({
            black_id: 1,
            white_id: 2,
            rengo: true,
            rengo_teams: { black: [{ id: 1 }, { id: 5 }], white: [{ id: 2 }, { id: 6 }] },
        });
        expect(user_color(goban, 6)).toBe("white");
    });
});
