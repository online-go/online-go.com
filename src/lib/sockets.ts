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

import * as data from "data";
import Debug from "debug";
import { current_language } from 'translate';

declare var ogs_language_version;
declare var ogs_version;

const debug = new Debug("sockets");

let io_config = {
    reconnection: true,
    reconnectionDelay: 750,
    reconnectionDelayMax: 10000,
    transports: ["websocket"],
    upgrade: false,
};

export const termination_socket = window['websocket_host'] ? io(window['websocket_host'], io_config) : io(io_config);
export const comm_socket = termination_socket;

termination_socket.send = termination_socket.emit;

termination_socket.on("connect", () => {
    debug.log("Connection to server established.");
    termination_socket.emit('hostinfo');
});
termination_socket.on('HUP', () => window.location.reload());
termination_socket.on('hostinfo', (hostinfo) => {
    debug.log("Termination server", hostinfo);
});

let last_clock_drift = 0.0;
let last_latency = 0.0;

function ping() {
    if (termination_socket.connected) {
        termination_socket.send("net/ping", {
            client: Date.now(),
            drift: last_clock_drift,
            latency: last_latency,
        });
    }
}
function handle_pong(data) {
    let now = Date.now();
    let latency = now - data.client;
    let drift = ((now - latency / 2) - data.server);
    last_latency = latency;
    last_clock_drift = drift;
}
function send_client_info() {
    termination_socket.send("client/info", {
        language: current_language,
        langauge_version: ogs_language_version,
        version: ogs_version,
    });
}
export function get_network_latency(): number {
    return last_latency;
}
export function get_clock_drift(): number {
    return last_clock_drift;
}
termination_socket.on("net/pong", handle_pong);
termination_socket.on("connect", ping);
termination_socket.on("connect", send_client_info);
setInterval(ping, 10000);


export default {
    termination_socket: termination_socket,
    comm_socket: comm_socket,
    get_clock_drift: get_clock_drift,
    get_network_latency: get_network_latency,
};

