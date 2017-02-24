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
import * as ReactDOM from "react-dom";
import {EventEmitter} from "eventemitter3";

interface PopupCoordinates {
    x: number;
    y: number;
};

interface PopoverConfig {
    elt: React.ReactElement<any>;
    at?: PopupCoordinates;
    minWidth?: number;
    minHeight?: number;
    //above?:HTMLElement;;
    //below?:HTMLElement;;
    //left?:HTMLElement;;
    //right?:HTMLElement;;
};

let last_id: number = 0;
let open_popovers = {};

export class PopOver extends EventEmitter {
    id: number;
    config: PopoverConfig;
    container: HTMLElement;
    backdrop: HTMLElement;

    constructor(config: PopoverConfig, backdrop: HTMLElement, container: HTMLElement) {
        super();
        this.id = ++last_id;
        this.config = config;
        this.container = container;
        this.backdrop = backdrop;
        $(backdrop).click(this.close);
        $(container).click(this.close);
        open_popovers[this.id] = this;
    }

    close = (ev) => {
        if (!ev || (ev.target === this.backdrop || ev.target === this.container)) {
            ReactDOM.unmountComponentAtNode(this.container);
            $(this.container).remove();
            $(this.backdrop).remove();
            delete open_popovers[this.id];

            this.emit("close");
        }
    }
}

export function close_all_popovers(): void {
    for (let k in open_popovers) {
        open_popovers[k].close();
    }
}

export function popover(config: PopoverConfig): PopOver {
    let backdrop = $("<div class='popover-backdrop'></div>");
    let container = $("<div class='popover-container'></div>");

    let minWidth: number = config.minWidth || 150;
    let minHeight: number = config.minHeight || 25;
    let x: number = 0;
    let y: number = 0;
    let bounds = {x: document.body.scrollLeft + window.innerWidth - 16 , y: document.body.scrollTop + window.innerHeight - 16};

    if (config.at) {
        x = config.at.x;
        y = config.at.y;
    }

    x = Math.min(x, bounds.x - minWidth);
    y = Math.min(y, bounds.y - minHeight);

    container.css({minWidth: minWidth, minHeight: minHeight, top: y, left: x});

    $(document.body).append(backdrop);
    $(document.body).append(container);

    ReactDOM.render(config.elt, container[0]);
    return new PopOver(config, backdrop[0], container[0]);
}
