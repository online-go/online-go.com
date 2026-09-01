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
import { socket } from "@/lib/sockets";

// Re-export from shared location for backward compatibility
export { goban_view_mode, goban_view_squashed } from "@/components/GobanView";
export type { ViewMode } from "@/components/GobanView";

export const shared_ip_with_player_map: { [game_id: number]: boolean } = {};

socket.on(
    "score-estimator-enabled-state",
    (state: { game_id: number; shared_ip_with_player: boolean }) => {
        shared_ip_with_player_map[state.game_id] = state.shared_ip_with_player;
    },
);

/** The colour the given player is playing, or null when they are not in the
 *  game. Unlike `GobanEngine.playerColor`, this resolves rengo team members
 *  who are not the currently-seated player for their team. */
export function user_color(goban: Goban, player_id: number): "black" | "white" | null {
    const engine = goban.engine;
    const color = engine.playerColor(player_id);
    if (color !== "invalid") {
        return color;
    }
    if (engine.rengo && engine.rengo_teams) {
        for (const team of ["black", "white"] as const) {
            if (engine.rengo_teams[team].some((player) => player.id === player_id)) {
                return team;
            }
        }
    }
    return null;
}
