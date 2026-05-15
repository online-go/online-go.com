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

import type { KibitzVariationSummary } from "@/models/kibitz";
import { clampDesktopSidebarWidthPx, pruneVisibleVariationIdsForGame } from "./KibitzInner";

function makeVariation(id: string, gameId: number): KibitzVariationSummary {
    return {
        id,
        room_id: "room-1",
        game_id: gameId,
        creator: {
            id: gameId,
            username: `user-${gameId}`,
            ranking: 1,
            professional: false,
            ui_class: "",
        },
        created_at: gameId,
        viewer_count: 0,
        current_viewers: [],
    };
}

describe("pruneVisibleVariationIdsForGame", () => {
    it("drops variations from other games when switching to a new game", () => {
        const variations = [
            makeVariation("a1", 10),
            makeVariation("a2", 10),
            makeVariation("b1", 20),
        ];

        expect(pruneVisibleVariationIdsForGame(variations, ["a1", "a2", "b1"], 20)).toEqual(["b1"]);
    });

    it("keeps the current list when no game is selected", () => {
        const variations = [makeVariation("a1", 10), makeVariation("b1", 20)];

        expect(pruneVisibleVariationIdsForGame(variations, ["a1", "b1"], null)).toEqual([
            "a1",
            "b1",
        ]);
    });
});

describe("clampDesktopSidebarWidthPx", () => {
    it("enforces comfortable min width on wide layouts", () => {
        expect(clampDesktopSidebarWidthPx(100, 1200)).toBe(336);
    });

    it("allows narrower minimum on constrained layouts", () => {
        expect(clampDesktopSidebarWidthPx(100, 900)).toBe(288);
    });

    it("caps width so the stage remains usable", () => {
        expect(clampDesktopSidebarWidthPx(900, 1200)).toBeLessThanOrEqual(576);
    });

    it("handles invalid width safely", () => {
        expect(clampDesktopSidebarWidthPx(Number.NaN, 1200)).toBe(336);
    });
});
