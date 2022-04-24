/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import * as React from "react";
import { socket } from "sockets";

interface UIPushProperties {
    event: string;
    channel?: string;
    action: (data: any) => any;
}

class Handler {
    id: number;
    event: string;
    cb: (data, event?) => void;
}

let last_handler_id = 0;
class UIPushManager {
    handlers: {
        [id: string]: Array<Handler>;
    };
    subscriptions: {
        [id: string]: number;
    };

    constructor() {
        this.handlers = {};
        this.subscriptions = {};

        socket.on("ui-push", (msg) => {
            if (msg.event in this.handlers) {
                for (const handler of this.handlers[msg.event]) {
                    handler.cb(msg.data, msg.event);
                }
            }
        });
        socket.on("connect", () => {
            /* handle resubscriptions */
            for (const channel in this.subscriptions) {
                socket.send("ui-pushes/subscribe", { channel: channel });
            }
        });
    }

    on(event, cb) {
        const handler = new Handler();
        (handler.id = ++last_handler_id), (handler.event = event);
        handler.cb = cb;

        if (!(event in this.handlers)) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(handler);
        return handler;
    }

    off(handler) {
        for (let i = 0; i < this.handlers[handler.event].length; ++i) {
            if (this.handlers[handler.event][i].id === handler.id) {
                this.handlers[handler.event].splice(i, 1);
                return;
            }
        }
    }

    subscribe(channel) {
        if (channel in this.subscriptions) {
            this.subscriptions[channel]++;
        } else {
            this.subscriptions[channel] = 1;
            if ((socket as any).connected) {
                socket.send("ui-pushes/subscribe", { channel: channel });
            }
        }
    }
    unsubscribe(channel) {
        if (this.subscriptions[channel] > 1) {
            this.subscriptions[channel]--;
        } else {
            delete this.subscriptions[channel];
            if ((socket as any).connected) {
                socket.send("ui-pushes/unsubscribe", { channel: channel });
            }
        }
    }
}

export const push_manager = new UIPushManager();

export function UIPush({ event, channel, action }: UIPushProperties): JSX.Element {
    React.useEffect(() => {
        if (event && action) {
            const handler = push_manager.on(event, action);
            return () => {
                push_manager.off(handler);
            };
        }
    }, [event, action]);

    React.useEffect(() => {
        if (channel) {
            push_manager.subscribe(channel);
            return () => {
                push_manager.unsubscribe(channel);
            };
        }
    }, [channel]);

    return null;
}
