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

import { createChatLineFromGobanLine } from "./KibitzSharedStreamPanel";
import { protocol } from "goban";

describe("createChatLineFromGobanLine", () => {
    it("hides malkovich chat while live and includes it after the game ends", () => {
        const line: protocol.GameChatLine = {
            chat_id: "malkovich-1",
            body: "Hidden during play",
            date: 1715600000,
            move_number: 120,
            channel: "malkovich",
            player_id: 42,
            username: "Oroton",
        };

        expect(createChatLineFromGobanLine("kibitz-room", line, false)).toBeNull();
        expect(createChatLineFromGobanLine("kibitz-room", line, true)).not.toBeNull();
    });
});
