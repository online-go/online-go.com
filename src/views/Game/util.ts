/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import { socket } from "sockets";

const win = $(window);

export type ViewMode = "portrait" | "wide" | "square";

export function goban_view_mode(bar_width?: number): ViewMode {
    if (!bar_width) {
        bar_width = 300;
    }

    const h = win.height() || 1;
    const w = win.width() || 1;
    const aspect_ratio = w / h;

    if ((aspect_ratio <= 0.8 || w < bar_width * 2) && w < 1280) {
        return "portrait";
    }

    if (aspect_ratio >= 1920 / 1200 && w >= 1280) {
        return "wide";
    }

    return "wide";
}
export function goban_view_squashed(): boolean {
    /* This value needs to match the "dock-inline-height" found in Dock.styl */
    return win.height() <= 500;
}

const shared_ip_with_player_map: { [game_id: number]: boolean } = {};

socket.on(
    "score-estimator-enabled-state",
    (state: { game_id: number; shared_ip_with_player: boolean }) => {
        shared_ip_with_player_map[state.game_id] = state.shared_ip_with_player;
    },
);
