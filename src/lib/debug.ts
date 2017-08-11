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

// Debugging flags to enable or disable debugging of individual modules.
// Set these values at will in the console.
export const debug = {
    data: false,
    player_cache: false,
    sockets: false,
};



// Make modules available globally. Use these for debugging purposes only.
// Don't even think of trying to access a module in the global scope.
import * as data from "data";
import * as player_cache from "player_cache";
import * as sockets from "sockets";

Object.assign(window, {
    debug: debug,
    data: data,
    player_cache: player_cache,
    sockets: sockets,
});



// Selective logging.
export function log(module: keyof typeof debug, ...rest: Array<any>) {
    if (debug[module]) {
        console.log(`[${module}]`, ...rest);
    }
}

// Assertions.
export function assert(module: keyof typeof debug, assertion: boolean, ...rest: Array<any>) {
    if (assertion) { return; }
    console.error(`[${module}]`, ...rest);

    // Phone home to tell of our distress.
    if (/online-(go|baduk|weiqi|covay|igo).(com|net)$/.test(document.location.host)) {
        /*
        $.ajax({
            url: "https://example.com/issues",
            type: "POST",
            data: {
                title: `Can't happen happened in ${module}.`,
                body: JSON.stringify(rest) + "\n" + new Error().stack,
            },
            crossDomain: true,
            beforeSend: (() => true),
            success: console.log,
            error: console.warn,
        });
        */
    }
}
