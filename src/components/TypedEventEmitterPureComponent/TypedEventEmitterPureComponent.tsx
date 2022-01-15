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
import * as data from "data";
import { TypedEventEmitter } from "TypedEventEmitter";

export class TypedEventEmitterPureComponent<Events, Props, State> extends React.PureComponent<
    Props,
    State
> {
    event_emitter: TypedEventEmitter<Events>;

    constructor(props: Props | Readonly<Props>) {
        super(props);
    }

    emit<K extends Extract<keyof Events, string>>(event: K, arg?: Events[K]): boolean {
        if (this.event_emitter) {
            return this.event_emitter.emit(event, arg);
        }
        return false;
    }
    on<K extends Extract<keyof Events, string>>(
        event: K,
        listener: (arg?: Events[K]) => any,
    ): this {
        this.__initialize_event_emitter();
        this.event_emitter.on(event, listener);
        return this;
    }
    once<K extends Extract<keyof Events, string>>(
        event: K,
        listener: (arg?: Events[K]) => any,
    ): this {
        this.__initialize_event_emitter();
        this.event_emitter.once(event, listener);
        return this;
    }
    off<K extends Extract<keyof Events, string>>(
        event: K,
        listener: (arg?: Events[K]) => any,
    ): this {
        this.__initialize_event_emitter();
        this.event_emitter.off(event, listener);
        return this;
    }
    removeAllListeners<K extends Extract<keyof Events, string>>(event?: K): this {
        if (this.event_emitter) {
            this.event_emitter.removeAllListeners(event);
        }
        return this;
    }

    private __initialize_event_emitter() {
        if (this.event_emitter) {
            return;
        }
        this.event_emitter = new TypedEventEmitter<Events>();
    }
}
