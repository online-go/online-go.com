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

import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { TypedEventEmitterPureComponent } from "@/components/TypedEventEmitterPureComponent";

let current_modal: any = null;

let open_modal_cb: ((modal: Modal<any, any, any>) => void) | null = null;

type ModalProps<P> = P & { fastDismiss?: boolean };
export type ModalConstructorInput<P> = ModalProps<P> | Readonly<ModalProps<P>>;
export class Modal<Events, P, S> extends TypedEventEmitterPureComponent<
    Events & { close: never; open: never },
    P & { fastDismiss?: boolean; onClose?: () => void },
    S
> {
    constructor(props: ModalConstructorInput<P>) {
        super(props);
        current_modal = this;
        if (open_modal_cb) {
            open_modal_cb(this);
        }
    }
    close = () => {
        if (this.props.onClose) {
            this.props.onClose();
        }
        this.emit("close");
    };
    bindContainer(container: HTMLElement) {
        if (this.props.fastDismiss) {
            container.onclick = (ev) => {
                if (ev.target === container) {
                    this.close();
                }
            };
        }
    }
    _open = () => {
        const backdrop = document.createElement("div");
        backdrop.className = "Modal-backdrop";

        document.body.appendChild(backdrop);

        if (this.props.fastDismiss) {
            backdrop.onclick = () => {
                this.close();
            };
        }

        const on_escape = (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.keyCode === 27) {
                this.close();
            }
        };
        const on_close = () => {
            //container.remove();
            backdrop.parentNode?.removeChild(backdrop);
            this.off("close", on_close);
            document.body.removeEventListener("keydown", on_escape as any);
        };

        this.on("close", on_close);
        document.body.addEventListener("keydown", on_escape as any);

        this.emit("open");
    };
    componentDidMount() {
        this._open();
    }
}

export function openModal(modal: any): any {
    if (open_modal_cb) {
        console.warn("Modal already open, calling openModal again might have unexpected results");
    }

    const container = document.createElement("div");
    container.className = "Modal-container";

    const root = ReactDOM.createRoot(container);
    document.body.appendChild(container);
    root.render(<React.StrictMode>{modal}</React.StrictMode>);
    open_modal_cb = (modal) => {
        modal.on("close", () => {
            root.unmount();
            container.parentNode?.removeChild(container);
            open_modal_cb = null;
        });
        modal.bindContainer(container);
    };
    return current_modal;
}
