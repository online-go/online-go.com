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

import type { KibitzStreamItem, KibitzWatchedGame } from "@/models/kibitz";
import { formatWatchedGameLabel, recentWatchedGameChatIds } from "./kibitzWatchedGameChat";

const game: KibitzWatchedGame = {
    game_id: 42,
    board_size: "19x19",
    title: "Alice vs Bob",
    black: { id: 10, username: "Alice", ranking: 37, professional: true, ui_class: "" },
    white: { id: 20, username: "Bob", ranking: -1000, professional: false, ui_class: "" },
};

test("omits a matchup title and formats professional and provisional ranks", () => {
    expect(formatWatchedGameLabel("bob vs. alice", game)).toBe("Alice [1p] vs Bob [?]");
    expect(formatWatchedGameLabel("Summer Cup Final", game)).toBe(
        "Summer Cup Final: Alice [1p] vs Bob [?]",
    );
});

test("keeps the player name when that player's rank is missing", () => {
    expect(
        formatWatchedGameLabel(game.title, {
            ...game,
            white: { ...game.white, ranking: NaN },
        }),
    ).toBe("Alice [1p] vs Bob");
});

test("bounds background metadata lookups to recent distinct games in the active room", () => {
    const notices: KibitzStreamItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `notice-${i + 1}`,
        room_id: "room-1",
        type: "system",
        game_id: i + 1,
        text: "The watched game changed to Friendly Match",
        created_at: i,
    }));
    const newest = notices[notices.length - 1];
    const history = [
        ...notices,
        { ...newest, id: "duplicate" },
        { ...newest, id: "other-room", room_id: "room-2", game_id: 21 },
        { ...newest, id: "proposal", type: "proposal_result" as const, game_id: 22 },
        { ...newest, id: "no-id", game_id: undefined },
    ];
    expect([...recentWatchedGameChatIds(history, "room-1")]).toEqual([
        20, 19, 18, 17, 16, 15, 14, 13, 12, 11,
    ]);
});
