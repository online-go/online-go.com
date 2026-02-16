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

/**
 * Web Worker entry point that runs the real GobanSocket inside a worker thread.
 * Communicates with GobanSocketProxy on the main thread via postMessage.
 */

// Import from engine only (not the full goban index) to avoid pulling in
// browser-specific code (SVGRenderer, focus_tracker, etc.) that references
// window/document which don't exist in a Worker context.
import { GobanSocket } from "../../submodules/goban/src/engine/GobanSocket";
import type {
    GobanSocketProxyToWorkerMessage,
    GobanSocketWorkerToProxyMessage,
    GobanSocketProxyCallbackMessage,
} from "./GobanSocketWorkerProtocol";

let socket: GobanSocket | null = null;

function postMsg(msg: GobanSocketWorkerToProxyMessage) {
    self.postMessage(msg);
}

function syncProperties() {
    if (!socket) {
        return;
    }
    postMsg({
        type: "property_sync",
        connected: socket.connected,
        latency: socket.latency,
        clock_drift: socket.clock_drift,
    });
}

function setupSocketEventRelay(sock: GobanSocket) {
    // Override emit to relay all events to the main thread.
    // We use `any` for the override signature because EventEmitter3's
    // internal ArgumentMap types are not directly expressible here.
    const originalEmit = sock.emit.bind(sock);
    (sock as any).emit = function (event: string, ...args: unknown[]): boolean {
        postMsg({
            type: "event",
            event,
            args,
        });

        if (event === "connect" || event === "disconnect" || event === "latency") {
            syncProperties();
        }

        return (originalEmit as any)(event, ...args);
    };
}

self.addEventListener("message", (e: MessageEvent<GobanSocketProxyToWorkerMessage>) => {
    const msg = e.data;

    switch (msg.type) {
        case "init": {
            try {
                socket = new GobanSocket(msg.url, msg.options);
                setupSocketEventRelay(socket);
            } catch (e) {
                postMsg({
                    type: "event",
                    event: "error",
                    args: [e instanceof Error ? e.message : String(e)],
                });
            }
            break;
        }

        case "send": {
            if (!socket) {
                return;
            }
            if (msg.callbackId !== undefined) {
                const callbackId = msg.callbackId;
                socket.send(
                    msg.command as any,
                    msg.data as any,
                    (data?: unknown, error?: unknown) => {
                        const cbMsg: GobanSocketProxyCallbackMessage = {
                            type: "callback",
                            callbackId,
                            data,
                            error,
                        };
                        postMsg(cbMsg);
                    },
                );
            } else {
                socket.send(msg.command as any, msg.data as any);
            }
            break;
        }

        case "authenticate": {
            if (!socket) {
                return;
            }
            socket.authenticate(msg.data as any);
            break;
        }

        case "disconnect": {
            if (!socket) {
                return;
            }
            socket.disconnect();
            break;
        }

        case "ping": {
            if (!socket) {
                return;
            }
            socket.ping();
            break;
        }

        case "set_options": {
            if (!socket) {
                return;
            }
            const opts = msg.options;
            for (const key of Object.keys(opts) as Array<keyof typeof opts>) {
                if (opts[key] !== undefined) {
                    (socket.options as any)[key] = opts[key];
                }
            }
            break;
        }
    }
});
