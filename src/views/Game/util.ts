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
