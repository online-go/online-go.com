/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import type { KibitzRoomSummary, KibitzVariationSummary, KibitzWatchedGame } from "@/models/kibitz";
import { resolveSelectedVariationSourceGame } from "./KibitzRoomStage";

function makeUser(id: number, username: string) {
    return {
        id,
        username,
        ranking: 1,
        professional: false,
        ui_class: "",
    };
}

function makeGame(gameId: number, title: string): KibitzWatchedGame {
    return {
        game_id: gameId,
        board_size: "19x19",
        title,
        black: makeUser(gameId * 10 + 1, "black"),
        white: makeUser(gameId * 10 + 2, "white"),
    };
}

function makeVariation(gameId: number): KibitzVariationSummary {
    return {
        id: `variation-${gameId}`,
        room_id: "room-1",
        game_id: gameId,
        creator: makeUser(gameId, "creator"),
        created_at: 1,
        viewer_count: 0,
        current_viewers: [],
    };
}

describe("resolveSelectedVariationSourceGame", () => {
    it("prefers the cached game lookup when the room list does not have the source game yet", () => {
        const selectedVariation = makeVariation(4321);
        const cachedGame = makeGame(4321, "Cached source");
        const fallbackGame = makeGame(4321, "Fallback source");
        const rooms: KibitzRoomSummary[] = [];
        const gameById = new Map<number, KibitzWatchedGame>([[4321, cachedGame]]);

        expect(
            resolveSelectedVariationSourceGame(
                selectedVariation,
                undefined,
                rooms,
                gameById,
                fallbackGame,
            ),
        ).toBe(cachedGame);
    });

    it("falls back to the secondary pane game only when nothing else is available", () => {
        const selectedVariation = makeVariation(4321);
        const fallbackGame = makeGame(4321, "Fallback source");
        const rooms: KibitzRoomSummary[] = [];

        expect(
            resolveSelectedVariationSourceGame(
                selectedVariation,
                undefined,
                rooms,
                undefined,
                fallbackGame,
            ),
        ).toBe(fallbackGame);
    });
});
