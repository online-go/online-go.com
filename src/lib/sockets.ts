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
import { current_language } from "translate";
import { io } from "socket.io-client";
import { niceInterval } from "goban";

declare let ogs_language_version;
declare let ogs_version;

const debug = new Debug("sockets");

const io_config = {
    reconnection: true,
    reconnectionDelay: 750,
    reconnectionDelayMax: 10000,
    transports: ["websocket"],
    upgrade: false,
};

const ai_config = {
    reconnection: true,
    reconnectionDelay: 750,
    reconnectionDelayMax: 10000,
    transports: ["websocket"],
    upgrade: false,
};

export const socket = window["websocket_host"]
    ? io(window["websocket_host"], io_config)
    : io(io_config);

export let ai_host = "";
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
} else {
    ai_host = null;
}

export const ai_socket = ai_host ? io(ai_host, ai_config) : io(ai_config);

socket.send = socket.emit;
ai_socket.send = ai_socket.emit;
let connect_time = Date.now();
let times_connected = 0;
socket.on("connect", () => {
    debug.log("Connection to server established.");
    socket.emit("hostinfo");
    connect_time = Date.now();
    ++times_connected;
    if (times_connected > 1) {
        socket.emit("times_connected", times_connected);
    }
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
function send_client_info() {
    socket.send("client/info", {
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
socket.on("net/pong", handle_pong);
socket.on("connect", ping);
socket.on("connect", send_client_info);
niceInterval(ping, 10000);

function ai_ping() {
    if (ai_socket.connected) {
        ai_socket.send("net/ping", {
            client: Date.now(),
            latency: last_ai_latency,
        });
    }
}
function ai_handle_pong(data) {
    const now = Date.now();
    const latency = now - data.client;
    last_ai_latency = latency;
}

ai_socket.on("connect", ai_ping);
ai_socket.on("net/pong", ai_handle_pong);
niceInterval(ai_ping, 20000);

export default {
    socket: socket,
    ai_socket: ai_socket,
    get_clock_drift: get_clock_drift,
    get_network_latency: get_network_latency,
};

(window as any)["socket"] = socket;

/** Experimental direct websocket connection to the server */
import { OGSSocket } from "goban";
import platform from "platform";

const urls = {
    cloudflare: window.location.origin.replace("http", "ws") + "/",
    "gcp-premium": "wss://gcp-premium.online-go.com/",
    "gcp-standard": "wss://gcp-standard.online-go.com/",
    beta: "wss://beta.online-go.com/",
};

const connection_counts = {
    cloudflare: 0,
    "gcp-premium": 0,
    "gcp-standard": 0,
    beta: 0,
};

const device_info = gather_device_info("", 0);
for (const [route, url] of Object.entries(urls)) {
    const test_socket = new OGSSocket(url);

    test_socket.on("connect", () => {
        connection_counts[route] += 1;
        //console.log("Connected to " + route + " " + connection_counts[route] + " times");
        test_socket.send("net/connects", {
            route,
            times_connected: connection_counts[route],
            device_info,
        });
    });
    test_socket.on("latency", (latency: number) => {
        console.info("Latency to " + route + ": " + latency + "ms");
        test_socket.send("net/route_latency", { route, latency, mobile: device_info.mobile });
    });
    test_socket.on("unrecoverable_error", (code: number, tag: string, message: string) => {
        console.error("Unrecoverable error: " + code + " " + tag + " " + message);
        socket.send("net/unrecoverable_error", {
            code,
            tag,
            message,
            route,
            device_info,
        });
    });
}

try {
    let sent_performance = false;
    const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
            try {
                if (
                    entry.duration > 0 &&
                    entry.domInteractive > 0 &&
                    entry.domComplete > 0 &&
                    entry.connectStart > 0 &&
                    !sent_performance
                ) {
                    sent_performance = true;
                    socket.send("client/performance", {
                        device_info: gather_device_info("", 0),
                        dom_interactive: entry.domInteractive,
                        dom_complete: entry.domComplete,
                        connect_start: entry.connectStart,
                        duration: entry.duration,
                    });
                }
            } catch (e) {
                console.error(e);
            }
        });
    });

    observer.observe({ type: "navigation", buffered: true });
} catch (e) {
    console.error(e);
    //
}

interface DeviceInfo {
    route: string;
    times_connected: number; // for tracking how many times we have to reconnect to the server
    device_pixel_ratio: number;
    screen_width: number;
    screen_height: number;
    mobile: boolean;
    manufacturer: string; // Apple, Amazon, etc..
    product: string; // Galaxy S4, iPad, Kindle Fire, Nexus, etc..
    os_name: string;
    os_version: string;
    browser_name: string;
    browser_version: string;
    layout: string; // Layout engine, ie: "Blink", "Gecko", "Trident", "WebKit"
    useragent: string;
}

function gather_device_info(route: string, times_connected: number): DeviceInfo {
    try {
        let mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
        );
        mobile = mobile || navigator.userAgent.toLowerCase().indexOf("mobile") >= 0;

        return {
            route: route,
            times_connected: times_connected,
            device_pixel_ratio: window.devicePixelRatio,
            screen_width: screen.width,
            screen_height: screen.height,
            mobile: mobile,
            manufacturer: platform.manufacturer,
            product: platform.product,
            os_name: platform.os?.family,
            os_version: platform.os?.version,
            browser_name: platform.name,
            browser_version: platform.version,
            layout: platform.layout,
            useragent: navigator.userAgent,
        };
    } catch (e) {
        console.error(e);
    }
    return {
        route: route,
        times_connected: times_connected,
        useragent: navigator.userAgent,
        device_pixel_ratio: 0,
        screen_width: 1,
        screen_height: 1,
        mobile: false,
        manufacturer: "unknown",
        product: "unknown",
        os_name: "unknown",
        os_version: "unknown",
        browser_name: "unknown",
        browser_version: "unknown",
        layout: "unknown",
    };
}
