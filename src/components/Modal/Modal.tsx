/*
 * Copyright (C) 2012-2019  Online-Go.com
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

import * as ReactDOM from "react-dom";
import {TypedEventEmitterPureComponent} from "TypedEventEmitterPureComponent";
import {dup} from "misc";

let current_modal = null;
export class Modal<Events, P, S> extends TypedEventEmitterPureComponent<Events & {"close": never, "open": never}, P&{fastDismiss?: boolean}, S> {
    constructor(props) {
        super(props);
        current_modal = this;
    }
    close = () => {
        this.emit("close");
    }
    _open = () => {
        let container = $(ReactDOM.findDOMNode(this)).parent();
        let backdrop = $("<div class='Modal-backdrop'></div>");
        $(document.body).append(backdrop);

        if (this.props.fastDismiss) {
            container.click((ev) => {
                if (ev.target === container[0]) {
                    this.close();
                }
            });
        }

        let on_escape = (event) => {
            if (event.keyCode === 27) {
                this.close();
            }
        };
        let on_close = () => {
            container.remove();
            backdrop.remove();
            this.off("close", on_close);
            $(document.body).off("keydown", on_escape);
        };

        this.on("close", on_close);
        $(document.body).on("keydown", on_escape);

        this.emit("open");
    }
    componentDidMount() {
        this._open();
    }
    componentWillReceiveProps(newProps: any) {
        this._open();
    }

    /********************/
    /*** State update ***/
    /********************/
    /* TODO: This state update system is something I did when I was just getting
     * started with React, it sucks. It's mostly been removed, but there are
     * a few modals left that still use it. The eventual goal is to refactor
     * those uses and remove this funcitonality all together. */
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
}


export function openModal(modal: any): any {
    let container = $("<div class='Modal-container'></div>");
    $(document.body).append(container);
    ReactDOM.render(modal, container[0]);
    return current_modal;
}
