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


import * as React from "react";
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";
import {comm_socket} from "sockets";

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
        [id: string]: Array<Handler>
    };
    subscriptions: {
        [id: string]: number
    };

    constructor() {
        this.handlers = {};
        this.subscriptions = {};

        comm_socket.on("ui-push", (msg) => {
            if (msg.event in this.handlers) {
                for (let handler of this.handlers[msg.event]) {
                    handler.cb(msg.data, msg.event);
                }
            }
        });
        comm_socket.on("connect", () => {
            /* handle resubscriptions */
            for (let channel in this.subscriptions) {
                comm_socket.send("ui-pushes/subscribe", {"channel": channel});
            }
        });
    }

    on(event, cb) {
        let handler = new Handler();
        handler.id = ++last_handler_id,
        handler.event = event;
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
            if ((comm_socket as any).connected) {
                comm_socket.send("ui-pushes/subscribe", {"channel": channel});
            }
        }
    }
    unsubscribe(channel) {
        if (this.subscriptions[channel] > 1) {
            this.subscriptions[channel]--;
        } else {
            delete this.subscriptions[channel];
            if ((comm_socket as any).connected) {
                comm_socket.send("ui-pushes/unsubscribe", {"channel": channel});
            }
        }
    }
}

export let push_manager = new UIPushManager();

export class UIPush extends React.Component<UIPushProperties, any> {
    handler: Handler = null;
    channel: string = null; // I'm here

    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(next) {
        if (this.props.event === next.event &&
            this.props.action === next.action &&
            this.props.channel === next.channel
        ) {
            return false;
        }
        return true;
    }

    removeHandler() {
        if (this.handler) {
            push_manager.off(this.handler);
            this.handler = null;
        }
    }
    unsubscribe() {
        if (this.channel) {
            push_manager.unsubscribe(this.channel);
            this.channel = null;
        }
    }

    sync() {
        if (this.handler) {
            this.removeHandler();
        }
        if (this.props.event) {
            this.handler = push_manager.on(this.props.event, this.props.action);
        }

        if (this.props.channel !== this.channel) {
            this.unsubscribe();
            this.channel = this.props.channel;
            push_manager.subscribe(this.channel);
        }
    }

    componentDidUpdate() {
        this.sync();
    }
    componentDidMount() {
        this.sync();
    }
    componentWillUnmount() {
        this.removeHandler();
        this.unsubscribe();
    }


    render() {
        return null;
    }
}
