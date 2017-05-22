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

import * as ReactDOM from "react-dom";
import {EventEmitterPureComponent} from "EventEmitterPureComponent";

let current_modal = null;
export class Modal<P, S> extends EventEmitterPureComponent<P&{fastDismiss?: boolean}, S> {
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
        super.componentDidMount();
        this._open();
    }

    componentWillReceiveProps(newProps: any) {
        super.componentWillReceiveProps(newProps);
        this._open();
    }
}


export function openModal(modal: any): any {
    let container = $("<div class='Modal-container'></div>");
    $(document.body).append(container);
    ReactDOM.render(modal, container[0]);
    return current_modal;
}
