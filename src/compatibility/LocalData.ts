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

import {Player, RegisteredPlayer} from "data/Player";
import {serialise_player, deserialise_player, deserialise_friends} from "compatibility/Player";

export interface LocalData {
    debug: boolean;
    "ad-override": boolean;
    "email-banner-dismissed": boolean;
    user: Player;
    friends: Array<RegisteredPlayer>;
    [name: string]: any;
}

export const serialise_data: {readonly [name in keyof LocalData]?: (x: LocalData[name]) => string} = {
    user: serialise_player,
    friends: JSON.stringify,
};

export const deserialise_data: {readonly [name in keyof LocalData]?: (x: string) => LocalData[name]} = {
    user: deserialise_player,
    friends: deserialise_friends,
};

