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

/** Message from GobanSocketProxy to GobanSocketWorker */
export interface GobanSocketWorkerInitMessage {
    type: "init";
    url: string;
    options: GobanSocketOptions;
}

export interface GobanSocketWorkerSendMessage {
    type: "send";
    command: string;
    data: unknown;
    callbackId?: number;
}

export interface GobanSocketWorkerAuthenticateMessage {
    type: "authenticate";
    data: unknown;
}

export interface GobanSocketWorkerDisconnectMessage {
    type: "disconnect";
}

export interface GobanSocketWorkerPingMessage {
    type: "ping";
}

export interface GobanSocketWorkerSetOptionsMessage {
    type: "set_options";
    options: Partial<GobanSocketOptions>;
}

export type GobanSocketProxyToWorkerMessage =
    | GobanSocketWorkerInitMessage
    | GobanSocketWorkerSendMessage
    | GobanSocketWorkerAuthenticateMessage
    | GobanSocketWorkerDisconnectMessage
    | GobanSocketWorkerPingMessage
    | GobanSocketWorkerSetOptionsMessage;

/** Messages from GobanSocketWorker to GobanSocketProxy */
export interface GobanSocketProxyEventMessage {
    type: "event";
    event: string;
    args: unknown[];
}

export interface GobanSocketProxyCallbackMessage {
    type: "callback";
    callbackId: number;
    data?: unknown;
    error?: unknown;
}

export interface GobanSocketProxyPropertySyncMessage {
    type: "property_sync";
    connected: boolean;
    latency: number;
    clock_drift: number;
}

export type GobanSocketWorkerToProxyMessage =
    | GobanSocketProxyEventMessage
    | GobanSocketProxyCallbackMessage
    | GobanSocketProxyPropertySyncMessage;
