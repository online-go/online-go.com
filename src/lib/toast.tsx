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
import { TypedEventEmitter } from "@/lib/TypedEventEmitter";

interface Events {
    close: never;
}

let toast_meta_container: HTMLElement | null = null;

export class Toast extends TypedEventEmitter<Events> {
    private react_root: ReactDOM.Root;
    container: HTMLElement;
    timeout: any = null;

    constructor(root: ReactDOM.Root, container: HTMLElement, timeout: number) {
        super();
        this.container = container;
        this.react_root = root;
        if (timeout) {
            this.timeout = setTimeout(() => {
                this.timeout = null;
                this.close();
            }, timeout);
        }
    }

    close() {
        this.react_root.unmount();
        const parent = this.container.parentElement;
        if (parent) {
            parent.remove();
        }
        this.container.remove();
        if (this.timeout) {
            this.timeout = null;
            clearTimeout(this.timeout);
        }
        this.emit("close");
    }
}

export function toast(element: React.ReactElement<any>, timeout: number = 0): Toast {
    if (toast_meta_container == null) {
        toast_meta_container = document.createElement("div");
        toast_meta_container.id = "toast-meta-container";
        document.body.appendChild(toast_meta_container);
    }

    const position_container = document.createElement("div");
    position_container.className = "toast-position-container";
    toast_meta_container.prepend(position_container);

    const container = document.createElement("div");
    container.className = "toast-container";
    position_container.appendChild(container);

    const root = ReactDOM.createRoot(container);
    root.render(<React.StrictMode>{element}</React.StrictMode>);
    const ret = new Toast(root, container, timeout);

    container.addEventListener("click", (ev) => {
        const target = ev.target as HTMLElement;
        if (target.nodeName !== "BUTTON" && target.className.indexOf("fab") === -1) {
            ret.close();
        }
    });

    setTimeout(() => {
        position_container.style.height = `${container.offsetHeight}px`;
        position_container.classList.add("opaque");
    }, 1);

    setTimeout(() => {
        container.style.position = "relative";
        position_container.style.height = "auto";
        position_container.style.minHeight = `${position_container.offsetHeight + 3}px`;
    }, 350);

    return ret;
}

declare global {
    interface Window {
        toast: typeof toast;
    }
}
window.toast = toast;
