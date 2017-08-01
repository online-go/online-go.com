/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import * as data from "data";
import {EventEmitter} from "eventemitter3";

type ListenerFn = (...args: Array<any>) => void;

export class EventEmitterPureComponent<Props, State> extends React.PureComponent<Props, State> {
    event_emitter: EventEmitter;

    constructor(props) {
        super(props);
    }

    /*************/
    /*** EVENT ***/
    /*************/
    __initialize_event_emitter() {
        if (this.event_emitter) {
            return;
        }
        this.event_emitter = new EventEmitter();
    }
    emit(event: string | symbol, ...args: Array<any>): boolean {
        if (this.event_emitter) {
            return this.event_emitter.emit(event, ...args);
        }
    }
    on(event: string | symbol, fn: ListenerFn, context?: any): EventEmitter {
        this.__initialize_event_emitter();
        return this.event_emitter.on(event, fn, context);
    }
    once(event: string | symbol, fn: ListenerFn, context?: any): EventEmitter {
        this.__initialize_event_emitter();
        return this.event_emitter.once(event, fn, context);
    }
    off(event: string | symbol, fn?: ListenerFn, context?: any, once?: boolean): EventEmitter {
        this.__initialize_event_emitter();
        return this.event_emitter.off(event, fn, context, once);
    }
    removeAllListeners(event?: string | symbol): EventEmitter {
        if (this.event_emitter) {
            return this.event_emitter.removeAllListeners(event);
        }
    }
}
