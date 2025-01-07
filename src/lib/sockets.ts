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

import Debug from "@/lib/debug";
import { GobanSocket, protocol, GobanRenderer, JGOFTimeControl } from "goban";
import { lookingAtOurLiveGame } from "@/components/TimeControl/util";

const debug = new Debug("sockets");

export const socket = new GobanSocket(window.websocket_host ?? window.location.origin);

// Updated to be more helpful (shorter) when we know latencies
socket.options.ping_interval = 10000;
socket.options.timeout_delay = 8000;

const MIN_PING_INTERVAL = 3000; // blitz players would really like to know ASAP...
const MIN_TIMEOUT_DELAY = 1000;

const MAX_PING_INTERVAL = 15000;
const MAX_TIMEOUT_DELAY = 14000;

// TODO: localhost option removed for ai_host. Refactor.

export let ai_host = "https://beta-ai.online-go.com";
if (
    window.location.hostname.indexOf("dev.beta") >= 0 &&
    window.websocket_host === "https://online-go.com"
) {
    // if we're developing locally but connecting to the production system, use our local system for estimation
    ai_host = `http://localhost:13284`;
    console.log("AI Host set to: ", ai_host);
} else if (typeof process !== "undefined" && process.env.OGS_BACKEND === "LOCAL") {
    // if we're a developer using a local server, then use it for ai
    ai_host = `http://localhost:13284`;
} else if (
    // The CI doesn't work with beta.  Note that jest in the CI has NODE_ENV==="test".
    // the .org exception is for anoek's development environment
    // This logic causes web developers who are _not_ using a local server to use Beta for AI.
    (typeof process !== "undefined" &&
        process.env.NODE_ENV === "development" &&
        window.location.hostname.indexOf(".org") < 0) ||
    window.location.hostname.indexOf("beta") >= 0 ||
    window.location.hostname.indexOf("dev") >= 0
) {
    ai_host = "https://beta-ai.online-go.com";
} else if (window.location.hostname.indexOf("online-go.com") >= 0) {
    ai_host = "https://ai.online-go.com";
} else if (window.location.hostname.indexOf("ogs") >= 0) {
    ai_host = `${window.location.protocol}//ai-${window.location.hostname}`;
} else if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    // don't set ai host because we dont use it in tests (stubbed)
} else {
    console.warn("AI Host not set, defaulting to localhost", window.location.hostname);
}

export const ai_socket = new GobanSocket<protocol.ClientToAIServer, protocol.AIServerToClient>(
    ai_host,
);

ai_socket.options.ping_interval = 20000;

let last_clock_drift = 0.0;
let last_latency = 0.0;
let connect_time: number | null = null;
let timing_needed = 0; // if non zero, this is the speed that they are playing at (in ms)

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

socket.on("latency", (latency, drift) => {
    last_latency = latency;
    last_clock_drift = drift;

    // If they are playing a live game at the moment, work out what timing they would like
    // us to make sure that they have...
    if (lookingAtOurLiveGame()) {
        const goban = window.global_goban as GobanRenderer;
        const time_control = goban.engine.time_control as JGOFTimeControl;
        switch (time_control.system) {
            case "fischer":
                timing_needed = time_control.time_increment || time_control.initial_time;
                break;

            case "byoyomi":
                timing_needed = time_control.period_time || time_control.main_time;
                break;

            case "canadian":
                timing_needed = time_control.period_time || time_control.main_time;
                break;

            case "simple":
                timing_needed = time_control.per_move;
                break;

            case "absolute":
                // actually, they'd like it as fast as possible, but this probably suffices
                timing_needed = time_control.total_time;
                break;
        }
    } else {
        timing_needed = 0;
    }

    timing_needed = timing_needed * 1000; // Time control is seconds, we need milliseconds

    if (timing_needed && (socket.options.timeout_delay || 0) > timing_needed / 2) {
        // if we're going slower than the timing they need, we better at least as fast as they need
        socket.options.timeout_delay = timing_needed / 2;
        socket.options.ping_interval = timing_needed;
        console.log("Set network timeout for game:", socket.options.timeout_delay);
    } else {
        // Ping more quickly for people with fast connections (to detect outages fast)
        if (latency < Math.max(3 * (socket.options.ping_interval || 0), MIN_PING_INTERVAL)) {
            socket.options.ping_interval = Math.max(latency * 3, MIN_PING_INTERVAL);
        }
        if (
            !last_latency ||
            latency < Math.max(2 * (socket.options.timeout_delay || 0), MIN_TIMEOUT_DELAY)
        ) {
            // wind down the timeout for people with fast connections (to detect outages fast)
            socket.options.timeout_delay = Math.max(latency * 2, MIN_TIMEOUT_DELAY);
        }
    }

    /*
    console.log(
        "latency update",
        latency,
        drift,
        socket.options.timeout_delay,
        socket.options.ping_interval,
    );
    */
});

// If we timed out, maybe their internet just went slow...
socket.on("timeout", () => {
    socket.options.ping_interval = Math.min(
        (socket.options.ping_interval || 0) * 2,
        MAX_PING_INTERVAL,
    );
    socket.options.timeout_delay = Math.min(
        (socket.options.timeout_delay || 0) * 2,
        MAX_TIMEOUT_DELAY,
    );
    console.log("Network ping timeout, increased delay to:", socket.options.timeout_delay);
});

/* Returns the time in ms since the last time a connection was established to
 * the server.
 * (Zero if we've never connected)
 */
export function time_since_connect() {
    return connect_time ? Date.now() - connect_time : 0;
}

export function get_network_latency(): number {
    return last_latency;
}
export function get_clock_drift(): number {
    return last_clock_drift;
}

export default {
    socket: socket,
    ai_socket: ai_socket,
    get_clock_drift: get_clock_drift,
    get_network_latency: get_network_latency,
};

window.socket = socket;
