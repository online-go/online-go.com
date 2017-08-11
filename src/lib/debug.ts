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

const modules = {
    debug: debug,
    data: data,
    player_cache: player_cache,
    sockets: sockets,
};



// For use when saying "start_debugging();" becomes tiresome.
// Do not commit code with start_debugging_immediately = true !
let start_debugging_immediately = false;



// Initialise the debugger. We don't do this unless asked so that we
// can avoid polluting the global namespace.
function start_debugging() {
    Object.assign(window, modules);
    return Object.keys(modules);
}

window["start_debugging"] = start_debugging;

if (start_debugging_immediately) {
    start_debugging();
}
else {
    console.info("Say \"start_debugging();\" to add useful things to the global scope.");
}



// Selective logging
export function log(module: keyof typeof debug, ...rest: Array<any>) {
    if (debug[module]) {
        console.log(`[${module}]`, ...rest);
    }
}

export function assert(module: keyof typeof debug, assertion: boolean, ...rest: Array<any>) {
    if (!assertion) {
        cant_happen(module, ...rest);
    }
}

let cant_happen_happened: boolean = false;
export function cant_happen(module: keyof typeof debug, ...rest: Array<any>) {
    console.error(`[${module}]`, ...rest);

    // To avoid a flood, we only record the first time the impossible happens.
    if (cant_happen_happened) {
        return;
    }
    cant_happen_happened = true;

    // Don't phone home on dev systems.
    if (!/online-(go|baduk|weiqi|covay|igo).(com|net)$/.test(document.location.host)) {
        return;
    }

    // Phone home to tell of our distress.
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
