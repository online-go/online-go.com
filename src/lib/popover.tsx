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

interface PopupCoordinates {
    x: number;
    y: number;
}

interface PopoverConfig {
    elt: React.ReactElement<any>;
    at?: PopupCoordinates; // Relative to window origin
    below?: HTMLElement;
    minWidth?: number;
    minHeight?: number;
    closeAfter?: number; // milliseconds till self-close
    animate?: boolean;
    container_class?: string;
}

let last_id = 0;
const open_popovers: { [id: number]: PopOver } = {};

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
        this.backdrop.addEventListener("click", this.close);
        this.container.addEventListener("click", this.close);
        open_popovers[this.id] = this;
        if (this.config.closeAfter) {
            setTimeout(this.fadeout, this.config.closeAfter);
        }
    }

    fadeout = () => {
        this.container.classList.add("popover-fadeout");
        setTimeout(this.close, 500); // matches css transition-duration
    };

    close = (ev?: React.MouseEvent | Event) => {
        if (!ev || ev.target === this.backdrop || ev.target === this.container) {
            this.container.remove();
            this.backdrop.remove();
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
    const container_class = config.container_class ? ` ${config.container_class}` : "";

    const backdrop = document.createElement("div");
    backdrop.className = "popover-backdrop";

    const container = document.createElement("div");
    container.className = `popover-container${container_class}`;

    const minWidth: number = config.minWidth || 150;
    const minHeight: number = config.minHeight || 25;
    let x = 0;
    let y = 0;
    const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const bounds = {
        x: scrollLeft + window.innerWidth - 16,
        y: scrollTop + window.innerHeight - 16,
    };

    if (config.at) {
        x = config.at.x;
        y = config.at.y;

        x = Math.min(x, bounds.x - minWidth);

        if (y < bounds.y - minHeight) {
            container.style.minWidth = `${minWidth}px`;
            container.style.top = `${y}px`;
            container.style.left = `${x}px`;
        } else {
            container.style.minWidth = `${minWidth}px`;
            container.style.bottom = `${window.innerHeight - y}px`;
            container.style.left = `${x}px`;
        }
    } else if (config.below) {
        const rectangle = config.below.getBoundingClientRect();
        x = rectangle.left + window.scrollX;
        x = Math.min(x, bounds.x - minWidth);
        console.log(bounds.x, x, minWidth);

        y = rectangle.bottom + window.scrollY;

        if (y < bounds.y - minHeight) {
            container.style.minWidth = `${minWidth}px`;
            container.style.top = `${y}px`;
            container.style.left = `${x}px`;
        } else {
            // Don't overlap the element we were supposed to be below.
            // If there is no space below, just go above it instead.
            container.style.minWidth = `${minWidth}px`;
            container.style.bottom = `${window.innerHeight - rectangle.top - window.scrollY}px`;
            container.style.left = `${x}px`;
        }
    }

    document.body.appendChild(backdrop);
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    root.render(<React.StrictMode>{config.elt}</React.StrictMode>);

    return new PopOver(config, backdrop, container);
}
