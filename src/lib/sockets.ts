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

import Debug from "debug";
import { GobanSocket, niceInterval, protocol } from "goban";

const debug = new Debug("sockets");

export const socket = new GobanSocket(window["websocket_host"] ?? window.location.origin);

export let ai_host;
if (
    window.location.hostname.indexOf("dev.beta") >= 0 &&
    window["websocket_host"] === "https://online-go.com"
) {
    // if we're developing locally but connecting to the production system, use our local system for estimation
    ai_host = `http://localhost:13284`;
    console.log("AI Host set to: ", ai_host);
} else if (
    // The CI doesn't work with beta.  Note that jest in the CI has NODE_ENV==="test".
    // the .org exception is for anoek's development environment
    (process.env.NODE_ENV === "development" && window.location.hostname.indexOf(".org") < 0) ||
    window.location.hostname.indexOf("beta") >= 0 ||
    window.location.hostname.indexOf("dev") >= 0
) {
    ai_host = "https://beta-ai.online-go.com";
} else if (window.location.hostname.indexOf("online-go.com") >= 0) {
    ai_host = "https://ai.online-go.com";
} else if (window.location.hostname.indexOf("ogs") >= 0) {
    ai_host = `${window.location.protocol}//ai-${window.location.hostname}`;
} else if (window.location.hostname === "localhost") {
    // automated test code stubs in localhost, no need to connect to the AI or warn
} else {
    console.warn("AI Host not set, AI reviews will not work", window.location.hostname);
}

export const ai_socket = ai_host
    ? new GobanSocket<protocol.ClientToAIServer, protocol.AIServerToClient>(ai_host)
    : undefined;

let connect_time = Date.now();
socket.on("connect", () => {
    debug.log("Connection to server established.");
    socket.send("hostinfo", {});
    connect_time = Date.now();
});
socket.on("HUP", () => window.location.reload());
socket.on("hostinfo", (hostinfo) => {
    debug.log("Termination server", hostinfo);
    //console.warn("Termination server", hostinfo);
});

let last_clock_drift = 0.0;
let last_latency = 0.0;
let last_ai_latency = 0.0;

/* Returns the time in ms since the last time a connection was established to
 * the server. */
export function time_since_connect() {
    return Date.now() - connect_time;
}

function ping() {
    if (socket.connected) {
        socket.send("net/ping", {
            client: Date.now(),
            drift: last_clock_drift,
            latency: last_latency,
        });
    }
}
function handle_pong(data) {
    const now = Date.now();
    const latency = now - data.client;
    const drift = now - latency / 2 - data.server;
    last_latency = latency;
    last_clock_drift = drift;
    (window as any)["latency"] = last_latency;
}
export function get_network_latency(): number {
    return last_latency;
}
export function get_clock_drift(): number {
    return last_clock_drift;
}
socket.on("net/pong", handle_pong);
socket.on("connect", ping);
niceInterval(ping, 10000);

function ai_ping() {
    if (ai_socket && ai_socket.connected) {
        ai_socket.send("net/ping", {
            client: Date.now(),
            drift: last_clock_drift,
            latency: last_ai_latency,
        });
    }
}
function ai_handle_pong(data) {
    const now = Date.now();
    const latency = now - data.client;
    last_ai_latency = latency;
}

ai_socket?.on("connect", ai_ping);
ai_socket?.on("net/pong", ai_handle_pong);
niceInterval(ai_ping, 20000);

export default {
    socket: socket,
    ai_socket: ai_socket,
    get_clock_drift: get_clock_drift,
    get_network_latency: get_network_latency,
};

(window as any)["socket"] = socket;
