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

import * as ReactDOM from "react-dom";
import { TypedEventEmitterPureComponent } from "TypedEventEmitterPureComponent";

let current_modal = null;

type ModalProps<P> = P & { fastDismiss?: boolean };
export type ModalConstructorInput<P> = ModalProps<P> | Readonly<ModalProps<P>>;
export class Modal<Events, P, S> extends TypedEventEmitterPureComponent<
    Events & { close: never; open: never },
    P & { fastDismiss?: boolean },
    S
> {
    constructor(props: ModalConstructorInput<P>) {
        super(props);
        current_modal = this;
    }
    close = () => {
        this.emit("close");
    };
    _open = () => {
        const container = $(ReactDOM.findDOMNode(this)).parent();
        const backdrop = $("<div class='Modal-backdrop'></div>");
        $(document.body).append(backdrop);

        if (this.props.fastDismiss) {
            container.click((ev) => {
                if (ev.target === container[0]) {
                    this.close();
                }
            });
        }

        const on_escape = (event) => {
            if (event.keyCode === 27) {
                this.close();
            }
        };
        const on_close = () => {
            container.remove();
            backdrop.remove();
            this.off("close", on_close);
            $(document.body).off("keydown", on_escape);
        };

        this.on("close", on_close);
        $(document.body).on("keydown", on_escape);

        this.emit("open");
    };
    componentDidMount() {
        this._open();
    }
    UNSAFE_componentWillReceiveProps() {
        this._open();
    }
}

export function openModal(modal: any): any {
    const container = $("<div class='Modal-container'></div>");
    $(document.body).append(container);
    ReactDOM.render(modal, container[0]);
    return current_modal;
}
