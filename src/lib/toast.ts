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
import * as ReactDOM from "react-dom";
import { TypedEventEmitter } from "TypedEventEmitter";

interface Events {
    close: never;
}

let toast_meta_container = null;

export class Toast extends TypedEventEmitter<Events> {
    container: HTMLElement;
    timeout: any = null;

    constructor(container: HTMLElement, timeout: number) {
        super();
        this.container = container;
        if (timeout) {
            this.timeout = setTimeout(() => {
                this.timeout = null;
                this.close();
            }, timeout);
        }
    }

    close() {
        ReactDOM.unmountComponentAtNode(this.container);
        $(this.container).parent().remove();
        $(this.container).remove();
        if (this.timeout) {
            this.timeout = null;
            clearTimeout(this.timeout);
        }
        this.emit("close");
    }
}

export function toast(
    element: React.ReactElement<any>,
    timeout?: number,
): Toast {
    if (toast_meta_container == null) {
        toast_meta_container = $("<div id='toast-meta-container'>");
        $(document.body).append(toast_meta_container);
    }

    const position_container = $("<div class='toast-position-container'>");
    toast_meta_container.prepend(position_container);

    const container = $("<div class='toast-container'>");
    position_container.append(container);

    ReactDOM.render(element, container[0]);
    const ret = new Toast(container[0] as HTMLElement, timeout);
    container.click((ev) => {
        if (
            ev.target.nodeName !== "BUTTON" &&
            ev.target.className.indexOf("fab") === -1
        ) {
            ret.close();
        }
    });

    setTimeout(() => {
        position_container
            .css({ height: container.outerHeight() })
            .addClass("opaque");
    }, 1);
    //position_container.css({height: 'auto'});
    setTimeout(() => {
        container.css({ position: "relative" });
        position_container.css({
            height: "auto",
            minHeight: position_container.height() + 3,
        });
    }, 350);

    return ret;
}
