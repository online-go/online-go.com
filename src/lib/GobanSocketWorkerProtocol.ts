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
 * Shared message types for the postMessage protocol between
 * GobanSocketProxy (main thread) and GobanSocketWorkerScript (worker).
 */

import type { GobanSocketOptions } from "goban";

/* ---- Messages from Proxy (main thread) -> Worker ---- */

export interface WorkerInitMessage {
    type: "init";
    url: string;
    options: GobanSocketOptions;
}

export interface WorkerSendMessage {
    type: "send";
    command: string;
    data: unknown;
    callbackId?: number;
}

export interface WorkerAuthenticateMessage {
    type: "authenticate";
    data: unknown;
}

export interface WorkerDisconnectMessage {
    type: "disconnect";
}

export interface WorkerPingMessage {
    type: "ping";
}

export interface WorkerSetOptionsMessage {
    type: "set_options";
    options: Partial<GobanSocketOptions>;
}

export type ProxyToWorkerMessage =
    | WorkerInitMessage
    | WorkerSendMessage
    | WorkerAuthenticateMessage
    | WorkerDisconnectMessage
    | WorkerPingMessage
    | WorkerSetOptionsMessage;

/* ---- Messages from Worker -> Proxy (main thread) ---- */

export interface WorkerEventMessage {
    type: "event";
    event: string;
    args: unknown[];
}

export interface WorkerCallbackMessage {
    type: "callback";
    callbackId: number;
    data?: unknown;
    error?: unknown;
}

export interface WorkerPropertySyncMessage {
    type: "property_sync";
    connected: boolean;
    latency: number;
    clock_drift: number;
}

export type WorkerToProxyMessage =
    | WorkerEventMessage
    | WorkerCallbackMessage
    | WorkerPropertySyncMessage;
