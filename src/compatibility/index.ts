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
import {Player} from "data/Player";
import {from_old_style_friends} from "compatibility/Player";


// Translate data from the server's loosely-typed schemas to our strongly-typed ones.
// There are two places where communication with the server happens: the request
// module and the sockets module. We deal first with requests. The interfaces
// URLDataType and URLResultType declare the type of the data that will be fed to
// and returned from an HTTP Ajax request. The translation functions then translate
// to and from the server's format.
export type URLType = URLDataType | URLResultType;
export interface URLDataType {
    "ui/friends": never;
    "/termination-api/player/%%": never;
    [url: string]: any;
}
export interface URLResultType {
    "ui/friends": Array<Player>;
    "/termination-api/player/%%": Player;
    [url: string]: any;
}
export const translate_from_server: {[url in keyof URLResultType]?: (result: any) => URLResultType[url]} = {
    "ui/friends": from_old_style_friends,
    "/termination-api/player/%%": player_cache.update
};
export const translate_to_server: {[url in keyof URLDataType]?: (data: URLDataType[url]) => any} = {

};
