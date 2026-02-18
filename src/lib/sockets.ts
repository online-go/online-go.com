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
import { protocol, GobanRenderer, JGOFTimeControl, DeviceInfo } from "goban";
import { GobanSocketProxy } from "@/lib/GobanSocketProxy";
import { lookingAtOurLiveGame } from "@/components/TimeControl/util";

const debug = new Debug("sockets");

const ROUTE_CLOUDFLARE = "wss://online-go.com";
const ROUTE_GOOGLE_PREMIUM = "wss://wsp.online-go.com";
const ROUTE_PUBLIC = "wss://wss.online-go.com";

// Detect if the user is on an Apple device (iOS or macOS)
// This is used for routing WebSocket connections around CloudFlare connectivity issues
export function isAppleDevice(): boolean {
    return /iPhone|iPad|iPod|Mac/.test(navigator?.userAgent || "");
}

function getRouteName(host: string): string {
    if (host === ROUTE_CLOUDFLARE) {
        return "cloudflare";
    }
    if (host === ROUTE_GOOGLE_PREMIUM) {
        return "google";
    }
    if (host === ROUTE_PUBLIC) {
        return "public";
    }
    return "development";
}

function getDeviceInfo(): DeviceInfo {
    const ua = navigator?.userAgent || "";

    const mobile = /Mobi|Android|iPhone|iPad|iPod/.test(ua); /* cspell:disable-line */

    let manufacturer = "unknown";
    if (/Samsung/i.test(ua)) {
        manufacturer = "Samsung";
    } else if (/iPhone|iPad|iPod|Mac/i.test(ua)) {
        manufacturer = "Apple";
    } else if (/Huawei/i.test(ua)) {
        manufacturer = "Huawei";
    } else if (/Pixel/i.test(ua)) {
        manufacturer = "Google";
    }

    let os_name = "unknown";
    if (/Windows/i.test(ua)) {
        os_name = "Windows";
    } else if (/Android/i.test(ua)) {
        os_name = "Android";
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
        os_name = "iOS";
    } else if (/Mac OS/i.test(ua)) {
        os_name = "macOS";
    } else if (/Linux/i.test(ua)) {
        os_name = "Linux";
    } else if (/CrOS/i.test(ua)) {
        os_name = "ChromeOS";
    }

    let browser_name = "unknown";
    if (/Edg\//i.test(ua)) {
        browser_name = "Edge";
    } else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
        browser_name = "Opera";
    } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
        browser_name = "Safari";
    } else if (/Chrome/i.test(ua)) {
        browser_name = "Chrome";
    } else if (/Firefox/i.test(ua)) {
        browser_name = "Firefox";
    }

    return { mobile, manufacturer, os_name, browser_name, useragent: ua };
}

function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Route selection logic (production only):
// - UK users: random between GCP Premium and GCP Public (Cloudflare ipv6 issues)
// - Apple devices: random between GCP Premium and GCP Public (Cloudflare connectivity issues)
// - Everyone else: equal random among all three routes
function getDefaultWebsocketHost(): string {
    const isProduction =
        window.location.hostname === "online-go.com" ||
        window.location.hostname === "www.online-go.com";

    if (isProduction) {
        if (window.ip_location?.country === "GB") {
            return randomChoice([ROUTE_GOOGLE_PREMIUM, ROUTE_PUBLIC]);
        }
        if (isAppleDevice()) {
            return randomChoice([ROUTE_GOOGLE_PREMIUM, ROUTE_PUBLIC]);
        }
        return randomChoice([ROUTE_CLOUDFLARE, ROUTE_GOOGLE_PREMIUM, ROUTE_PUBLIC]);
    }
    return window.location.origin;
}

const default_websocket_host = getDefaultWebsocketHost();

let main_websocket_host: string = window.websocket_host ?? default_websocket_host;
try {
    // can't use `data` here because of a dependency loop
    if (typeof localStorage !== "undefined" && localStorage.getItem("ogs.websocket_host")) {
        main_websocket_host = JSON.parse(localStorage.getItem("ogs.websocket_host") as string);
        console.log("Websocket host overridden to:", main_websocket_host);
    } else {
        console.log("Websocket host not overridden");
    }
} catch (e) {
    console.error(e);
}
if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    main_websocket_host = window.location.origin;
    console.log("%cConnecting locally (development mode)", "color: #888888; font-weight: bold;");
} else if (main_websocket_host === ROUTE_GOOGLE_PREMIUM) {
    console.log("%cConnecting via Google Premium Network", "color: #4285f4; font-weight: bold;");
} else if (main_websocket_host === ROUTE_PUBLIC) {
    console.log("%cConnecting via Public Internet", "color: #ff6b35; font-weight: bold;");
} else if (main_websocket_host === ROUTE_CLOUDFLARE) {
    console.log("%cConnecting via Cloudflare", "color: #f38020; font-weight: bold;");
} else {
    console.log(`%cConnecting via ${main_websocket_host}`, "color: #888888; font-weight: bold;");
}

export const socket = new GobanSocketProxy(main_websocket_host);

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
} else if (typeof process !== "undefined" && process.env.OGS_BACKEND === "PRODUCTION") {
    // if we're a developer using a local server, then use it for ai
    ai_host = `https://ai.online-go.com`;
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

export const ai_socket = new GobanSocketProxy<protocol.ClientToAIServer, protocol.AIServerToClient>(
    ai_host,
);

ai_socket.options.ping_interval = 20000;

let last_clock_drift = 0.0;
let last_latency = 0.0;
let connect_time: number | null = null;
let connection_count = 0;
let last_connection_duration_ms = 0;
let timing_needed = 0; // if non zero, this is the speed that they are playing at (in ms)

const route_name = getRouteName(main_websocket_host);
const device_info = getDeviceInfo();

socket.on("connect", () => {
    debug.log("Connection to server established.");
    socket.send("hostinfo", {});

    // Compute duration of previous connection
    if (connect_time !== null) {
        last_connection_duration_ms = Date.now() - connect_time;
    }
    connect_time = Date.now();
    connection_count++;

    // Send connection analytics
    socket.send("net/connects", {
        route: route_name,
        times_connected: connection_count,
        device_info,
        previous_connection_duration_ms: last_connection_duration_ms,
    });

    // Send any pending unrecoverable error from a previous session
    try {
        const pending = sessionStorage.getItem("ogs.pending_unrecoverable_error");
        if (pending) {
            sessionStorage.removeItem("ogs.pending_unrecoverable_error");
            socket.send("net/unrecoverable_error", JSON.parse(pending));
        }
    } catch {
        // ignore parse errors
    }
});

// Store unrecoverable error info so it can be sent on next connect
socket.on("disconnect", (code: number) => {
    if (code === 1014 || code === 1015) {
        try {
            sessionStorage.setItem(
                "ogs.pending_unrecoverable_error",
                JSON.stringify({
                    code,
                    tag: `close_${code}`,
                    route: route_name,
                    times_connected: connection_count,
                    device_info,
                }),
            );
        } catch {
            // sessionStorage may be unavailable
        }
    }
});

socket.on("HUP", () => window.location.reload());
socket.on("hostinfo", (hostinfo) => {
    debug.log("Termination server", hostinfo);
    //console.warn("Termination server", hostinfo);
});

const ROUTE_LATENCY_FIRST_REPORT_MS = 60_000;
const ROUTE_LATENCY_INTERVAL_MS = 600_000;
let last_route_latency_report = 0;

socket.on("latency", (latency, drift) => {
    last_latency = latency;
    last_clock_drift = drift;

    const now = Date.now();
    const elapsed = now - last_route_latency_report;
    const threshold =
        last_route_latency_report === 0 ? ROUTE_LATENCY_FIRST_REPORT_MS : ROUTE_LATENCY_INTERVAL_MS;
    if (elapsed >= threshold) {
        last_route_latency_report = now;
        socket.send("net/route_latency", {
            route: route_name,
            latency,
            mobile: device_info.mobile,
        });
    }

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
    const pre_ping_interval = socket.options.ping_interval || 0;
    const pre_timeout_delay = socket.options.timeout_delay || 0;

    socket.options.ping_interval = Math.min(pre_ping_interval * 2, MAX_PING_INTERVAL);
    socket.options.timeout_delay = Math.min(pre_timeout_delay * 2, MAX_TIMEOUT_DELAY);
    console.log("Network ping timeout, increased delay to:", socket.options.timeout_delay);

    socket.send("net/timeout", {
        route: route_name,
        ping_interval: pre_ping_interval,
        timeout_delay: pre_timeout_delay,
        latency: last_latency,
        times_connected: connection_count,
        in_live_game: lookingAtOurLiveGame(),
        device_info,
    });
});

// When the tab is hidden, browsers throttle timers (Chrome aggressively
// after 5 min, Safari even in Web Workers). Instead of stopping pings
// entirely, we switch to "background pinging": pings still go out at
// whatever rate the browser allows (keeping the connection alive through
// intermediaries) but we don't arm timeout timers and we ignore latency
// measurements from pong responses. On return to the foreground we mark
// all in-flight background pongs as stale and resume normal ping/pong
// behavior starting with an immediate ping.
if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            socket.options.background_pinging = true;
        } else {
            socket.options.ignore_pongs_before = Date.now();
            socket.options.background_pinging = false;
            if (socket.connected) {
                socket.ping();
            }
        }
    });
}

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
