/*
 * Copyright (C) 2012-2020  Online-Go.com
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
const debug = {
    data: false,
    player_cache: false,
    sockets: false,
};

// Create an instance of the Debug class to allow a module to debug itself.
export default class Debug {
    constructor(readonly module: keyof typeof debug) {}

    start() {
        debug[this.module] = true;
    }
    stop() {
        debug[this.module] = false;
    }

    private format(message: string): string {
        return `[${this.module}] ${message}`;
    }
    log = (message: string, ...rest: Array<any>) => {
        debug[this.module] ? console.log(this.format(message), ...rest) : undefined;
    };
    trace = (message: string, ...rest: Array<any>) => {
        debug[this.module] ? console.trace(this.format(message), ...rest) : undefined;
    };
    info = (message: string, ...rest: Array<any>) => {
        debug[this.module] ? console.info(this.format(message), ...rest) : undefined;
    };
    warn = (message: string, ...rest: Array<any>) => {
        console.warn(this.format(message), ...rest);
    };
    error = (message: string, ...rest: Array<any>) => {
        console.error(this.format(message), ...rest);
    };

    assert(assertion: boolean, message: string, ...rest: Array<any>) {
        if (assertion) { return; }
        console.error(this.format(message), ...rest);

        // TODO: Phone home to tell of our distress.
    }
}

window['debug'] = debug;
