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

import {termination_socket} from "sockets";

let active_bots = {};
let _bots_list = [];

export function bots() {
    return active_bots;
}
export function bots_list(): Array<any> {
    return _bots_list;
}
export function one_bot() {
    for (let k in active_bots) {
        return active_bots[k];
    }
    return null;
}
export function bot_count() {
    return Object.keys(active_bots).length;
}

termination_socket.on("active-bots", (bots) => {
    active_bots = bots;
    _bots_list = [];
    for (let id in bots) {
        _bots_list.push(bots[id]);
    }
    _bots_list.sort((a, b) => a.ranking - b.ranking);
});
