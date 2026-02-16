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
 * GobanSocketProxy is a drop-in replacement for GobanSocket that runs the
 * real WebSocket inside a dedicated Web Worker. This offloads JSON parsing,
 * ping/pong timers, and reconnection logic from the main thread and also
 * avoids Chromium's Intensive Timer Throttling in background tabs.
 *
 * The public API is identical to GobanSocket.
 */

import { EventEmitter } from "eventemitter3";
import type { ClientToServer, ClientToServerBase, ServerToClient } from "goban";
import type {
    GobanSocketEvents,
    DataArgument,
    ProtocolResponseType,
    IGobanSocket,
    GobanSocketOptions,
} from "goban";
import type { ProxyToWorkerMessage, WorkerToProxyMessage } from "./GobanSocketWorkerProtocol";
import { alert } from "@/lib/swal_config";

// Vite bundles the worker separately and returns the URL as a string.
// In dev, this is a same-origin Vite URL; in production, it points to the CDN.
import gobanSocketWorkerUrl from "./GobanSocketWorkerScript?worker&url";

export class GobanSocketProxy<
        SendProtocol extends ClientToServerBase = ClientToServer,
        RecvProtocol = ServerToClient,
    >
    extends EventEmitter<GobanSocketEvents>
    implements IGobanSocket<SendProtocol, RecvProtocol>
{
    public readonly url: string;
    public clock_drift = 0.0;
    public latency = 0.0;

    private _connected = false;
    private _options: GobanSocketOptions;
    private worker: Worker;
    private nextCallbackId = 0;
    private pendingCallbacks = new Map<
        number,
        { resolve: (data: any) => void; reject: (err: any) => void }
    >();

    /**
     * options is exposed via a JS Proxy so that mutations like
     *   `socket.options.ping_interval = 3000`
     * are transparently forwarded to the worker.
     */
    public options: GobanSocketOptions;

    constructor(url: string, options: GobanSocketOptions = {}) {
        super();

        this.url = url;
        this._options = { ...options };

        // Create a JS Proxy to intercept option writes and forward to worker
        this.options = new Proxy(this._options, {
            set: (target, prop: string, value) => {
                (target as any)[prop] = value;
                this.postToWorker({
                    type: "set_options",
                    options: { [prop]: value },
                });
                return true;
            },
        });

        // In dev, Vite serves the worker from the same origin.
        // In production, the CDN is cross-origin so we load from the
        // termination server (same-origin) instead.
        const bundledUrl = new URL(gobanSocketWorkerUrl, import.meta.url);
        this.worker =
            bundledUrl.origin === globalThis.location?.origin
                ? new Worker(bundledUrl, { type: "module" })
                : new Worker(
                      `/GobanSocketWorker/GobanSocketWorkerScript-${GOBAN_SOCKET_WORKER_VERSION}.js`,
                      { type: "module" },
                  );

        this.worker.addEventListener("message", this.onWorkerMessage);
        this.worker.addEventListener("error", this.onWorkerError);

        // Initialize the socket in the worker
        this.postToWorker({
            type: "init",
            url,
            options: this._options,
        });
    }

    get connected(): boolean {
        return this._connected;
    }

    public authenticate(authentication: DataArgument<SendProtocol["authenticate"]>): void {
        this.postToWorker({
            type: "authenticate",
            data: authentication,
        });
    }

    public send<Command extends keyof SendProtocol>(
        command: Command,
        data: DataArgument<SendProtocol[Command]>,
        cb?: (data: ProtocolResponseType<SendProtocol[Command]>, error?: any) => void,
    ): void {
        if (cb) {
            const callbackId = ++this.nextCallbackId;
            this.pendingCallbacks.set(callbackId, {
                resolve: (d: any) => cb(d),
                reject: (err: any) => cb(undefined as any, err),
            });
            this.postToWorker({
                type: "send",
                command: command as string,
                data,
                callbackId,
            });
        } else {
            this.postToWorker({
                type: "send",
                command: command as string,
                data,
            });
        }
    }

    public sendPromise<Command extends keyof SendProtocol>(
        command: Command,
        data: DataArgument<SendProtocol[Command]>,
    ): Promise<ProtocolResponseType<SendProtocol[Command]>> {
        return new Promise((resolve, reject) => {
            this.send(command, data, (data, error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });
    }

    public disconnect(): void {
        this.postToWorker({ type: "disconnect" });
        this.rejectPendingCallbacks("Socket disconnected");
    }

    public ping(): void {
        this.postToWorker({ type: "ping" });
    }

    private postToWorker(msg: ProxyToWorkerMessage): void {
        this.worker.postMessage(msg);
    }

    private rejectPendingCallbacks(reason: string): void {
        for (const [, entry] of this.pendingCallbacks) {
            entry.reject(new Error(reason));
        }
        this.pendingCallbacks.clear();
    }

    private onWorkerError = (e: ErrorEvent): void => {
        console.error("GobanSocket worker error:", e);
        this.rejectPendingCallbacks("Worker error");
        void alert.fire(
            "A critical error occurred with the network connection worker. " +
                "Please reload the page to restore connectivity.",
        );
    };

    private onWorkerMessage = (e: MessageEvent<WorkerToProxyMessage>): void => {
        const msg = e.data;

        switch (msg.type) {
            case "event":
                this.emit(msg.event as keyof GobanSocketEvents, ...(msg.args as [any]));
                break;

            case "callback": {
                const entry = this.pendingCallbacks.get(msg.callbackId);
                if (entry) {
                    this.pendingCallbacks.delete(msg.callbackId);
                    if (msg.error) {
                        entry.reject(msg.error);
                    } else {
                        entry.resolve(msg.data);
                    }
                }
                break;
            }

            case "property_sync":
                this._connected = msg.connected;
                this.latency = msg.latency;
                this.clock_drift = msg.clock_drift;
                break;
        }
    };
}
