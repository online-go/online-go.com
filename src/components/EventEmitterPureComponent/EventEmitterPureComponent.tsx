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
import {uuid, dup} from "misc";


type ListenerFn = (...args: Array<any>) => void;

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
    s4() + "-" + s4() + s4() + s4();
}

export class EventEmitterPureComponent<Props, State> extends React.PureComponent<Props, State> {
    uuid: string;
    event_emitter: EventEmitter;
    mounted: boolean = false;


    constructor(props) {
        super(props);
        this.uuid = uuid();
    }


    init(props) {
        if (this.event_emitter) {
            this.event_emitter.emit("init", props);
        }
    }
    deinit() {
        if (this.event_emitter) {
            this.event_emitter.emit("destroy");
        }
    }
    componentWillUnmount() {
        this.mounted = false;
        this.deinit();
        if (this.event_emitter) {
            this.event_emitter.emit("unmount");
        }
    }
    componentWillMount() {
    }
    componentDidMount() {
        this.mounted = true;
        if (this.event_emitter) {
            this.event_emitter.emit("mount");
        }
        this.init(this.props);
    }
    componentWillReceiveProps(newProps: any) {
        this.deinit();
        this.init(newProps);
    }

    /********************/
    /*** State update ***/
    /********************/
    upstate_object: any = null;

    nextState(): any {
        if (this.upstate_object == null) {
            this.upstate_object = dup(this.state);
        }
        return this.upstate_object;
    }
    next(): any {
        return this.nextState();
    }
    componentWillUpdate() {
        this.upstate_object = null;
    }
    bulkUpstate(arr) {
        let next_state: any = this.nextState();
        let state_update: any = {};

        for (let elt of arr) {
            let key = elt[0];
            let event_or_value = elt[1];

            let value = null;
            if (typeof(event_or_value) === "object" && "target" in event_or_value) {
                let target = event_or_value.target;
                value = target.type === "checkbox" ? target.checked : target.value;
            } else {
                value = event_or_value;
            }
            let components = key.split(".");
            let primary_key = components[0];
            let cur = next_state;
            while (components.length > 1) {
                cur = cur[components[0]];
                components.shift();
            }
            cur[components[0]] = value;
            state_update[primary_key] = next_state[primary_key];
        }
        this.setState(state_update);
    }
    upstate(key: string|Array<Array<any>>, event_or_value?) {
        if (!event_or_value && Array.isArray(key)) {
            return this.bulkUpstate(key);
        }
        return this.bulkUpstate([[key, event_or_value]]);
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
