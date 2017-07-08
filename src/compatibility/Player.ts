/*
 * Copyright (C) 2012-2017  Online-Go.com
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

import * as player_cache from "player_cache";
import {Player, RegisteredPlayer, player_attributes} from "data/Player";

export function to_old_style_player(player: RegisteredPlayer): any {
    let old_player: any = {};

    old_player.id = old_player.player_id = player.id;
    old_player.username = player.username;
    old_player.icon = old_player["icon-url"] = player.icon;
    old_player.country = player.country;
    old_player.ui_class = player_attributes(player).join(" ");
    old_player.is_superuser = !!player.is.admin;
    old_player.is_moderator = !!player.is.moderator;
    old_player.tournament_moderator = !!player.is.tournament_moderator;
    old_player.email_validated = !!player.is.validated;
    old_player.is_bot = !!player.is.bot;
    old_player.anonymous = false;
    old_player.supporter = player.is.supporter;
    if (player.rank && player.rank.type === "Pro") {
        old_player.ranking = player.rank.level + 36;
    }
    if (player.rank && player.rank.type === "Dan") {
        old_player.ranking = player.rank.level + 29;
    }
    if (player.rank && player.rank.type === "Kyu") {
        old_player.ranking = 30 - player.rank.level;
    }

    return old_player;
}

export function from_old_style_player(player: any): Player {
    return player_cache.update(player, true);
}
