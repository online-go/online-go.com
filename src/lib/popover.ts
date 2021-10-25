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
import {TypedEventEmitter} from "TypedEventEmitter";

interface Events {
    "close": never;
}

interface PopupCoordinates {
    x: number;
    y: number;
}

interface PopoverConfig {
    elt: React.ReactElement<any>;
    at?: PopupCoordinates;
    below?: React.ReactInstance;
    minWidth?: number;
    minHeight?: number;
    //above?:HTMLElement;;
    //below?:HTMLElement;;
    //left?:HTMLElement;;
    //right?:HTMLElement;;
}

let last_id = 0;
const open_popovers = {};

export class PopOver extends TypedEventEmitter<Events> {
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
    };
}

export function close_all_popovers(): void {
    for (const k in open_popovers) {
        open_popovers[k].close();
    }
}

export function popover(config: PopoverConfig): PopOver {
    const backdrop = $("<div class='popover-backdrop'></div>");
    const container = $("<div class='popover-container'></div>");

    const minWidth: number = config.minWidth || 150;
    const minHeight: number = config.minHeight || 25;
    let x = 0;
    let y = 0;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const bounds = {x: scrollLeft + window.innerWidth - 16 , y: scrollTop + window.innerHeight - 16};

    if (config.at) {
        x = config.at.x;
        y = config.at.y;

        x = Math.min(x, bounds.x - minWidth);

        if (y < bounds.y - minHeight) {
            container.css({minWidth: minWidth, top: y, left: x});
        } else {
            container.css({minWidth: minWidth, bottom: $(window).height() - y, left: x});
        }
    } else if (config.below) {
        const rectangle = (ReactDOM.findDOMNode(config.below) as Element).getBoundingClientRect();
        x = rectangle.left + window.scrollX;
        x = Math.min(x, bounds.x - minWidth);

        y = rectangle.bottom + window.scrollY;

        if (y < bounds.y - minHeight) {
            container.css({minWidth: minWidth, top: y, left: x});
        } else {
            // Don't overlap the element we were supposed to be below.
            // If there is no space below, just go above it instead.
            container.css({minWidth: minWidth, bottom: $(window).height() - rectangle.top - window.scrollY, left: x});
        }
    }

    $(document.body).append(backdrop);
    $(document.body).append(container);

    ReactDOM.render(config.elt, container[0]);
    return new PopOver(config, backdrop[0] as HTMLElement, container[0] as HTMLElement);
}
