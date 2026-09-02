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

// Minimum gap between a popover and the edge of the viewport.
const VIEWPORT_MARGIN = 16;

let last_id = 0;
const open_popovers: { [id: number]: PopOver } = {};

export class PopOver extends TypedEventEmitter<Events> {
    id: number;
    config: PopoverConfig;
    container: HTMLElement;
    backdrop: HTMLElement;
    private root: ReactDOM.Root | null;

    constructor(
        config: PopoverConfig,
        backdrop: HTMLElement,
        container: HTMLElement,
        root: ReactDOM.Root | null = null,
    ) {
        super();
        this.id = ++last_id;
        this.config = config;
        this.container = container;
        this.backdrop = backdrop;
        this.root = root;
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

            // Unmount the React root so effect cleanups run (event
            // listener subscriptions in the popover content would
            // otherwise leak). Deferred because close() is often called
            // from an event handler inside the root's own tree, and React
            // forbids synchronously unmounting a root while it renders.
            const root = this.root;
            this.root = null;
            if (root) {
                setTimeout(() => root.unmount(), 0);
            }

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
    container.style.minWidth = `${minWidth}px`;

    const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    // Anchor point in document coordinates: the popover's top-left corner
    // goes here when it fits. For `below`, `flip_bottom` is where the
    // popover's bottom edge goes when it has to sit above the element
    // instead so it never covers what it was opened from.
    let anchor_x = 0;
    let anchor_y = 0;
    let flip_bottom = 0;
    if (config.at) {
        anchor_x = config.at.x;
        anchor_y = config.at.y;
        flip_bottom = config.at.y;
    } else if (config.below) {
        const rectangle = config.below.getBoundingClientRect();
        anchor_x = rectangle.left + scrollLeft;
        anchor_y = rectangle.bottom + scrollTop;
        flip_bottom = rectangle.top + scrollTop;
    }

    // Place the container so that a popover of the given size stays inside
    // the viewport (with a small margin). The caller's minWidth / minHeight
    // are only a lower bound on the eventual rendered size, so this runs
    // once up front and again whenever the rendered size changes.
    const place = (width: number, height: number) => {
        const max_x = scrollLeft + window.innerWidth - VIEWPORT_MARGIN - width;
        const max_y = scrollTop + window.innerHeight - VIEWPORT_MARGIN;
        const x = Math.max(scrollLeft, Math.min(anchor_x, max_x));
        container.style.left = `${x}px`;

        if (anchor_y + height <= max_y) {
            container.style.top = `${anchor_y}px`;
            container.style.bottom = "";
        } else {
            container.style.top = "";
            container.style.bottom = `${window.innerHeight - flip_bottom}px`;
        }
    };

    place(minWidth, minHeight);

    document.body.appendChild(backdrop);
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    root.render(<React.StrictMode>{config.elt}</React.StrictMode>);

    const observer = new ResizeObserver(() => {
        place(
            Math.max(container.offsetWidth, minWidth),
            Math.max(container.offsetHeight, minHeight),
        );
    });
    observer.observe(container);

    const instance = new PopOver(config, backdrop, container, root);
    instance.on("close", () => observer.disconnect());
    return instance;
}
