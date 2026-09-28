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
import { flushSync } from "react-dom";
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
    /** A point on the page, in viewport coordinates (e.g. clientX / clientY)
     *  when the popover opens. It moves with the page when the page scrolls. */
    at?: PopupCoordinates;
    below?: HTMLElement;
    /** Place the popover to the left of this element: its right edge at the
     *  element's left edge, its top aligned with the element's top, moved
     *  up or down as needed to stay inside the viewport. */
    leftOf?: HTMLElement;
    /** With `leftOf`: align the popover's top with this element's top in
     *  place of the `leftOf` element's top. */
    alignTop?: HTMLElement;
    minWidth?: number;
    minHeight?: number;
    closeAfter?: number; // milliseconds till self-close
    animate?: boolean;
    container_class?: string;
}

// Minimum gap between a popover and the edge of the viewport.
const VIEWPORT_MARGIN = 16;
// Gap between a `leftOf` popover and the element it is opened from.
const LEFT_OF_GAP = 4;

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
    // Invisible and not interactive until the rendered content is measured
    // and placed, so the popover is never shown at a guessed position or
    // size. Opacity, not `visibility: hidden`, so that content can still
    // take focus while it mounts (for example with `autoFocus`).
    container.style.opacity = "0";
    container.style.pointerEvents = "none";

    const minWidth: number = config.minWidth || 150;
    const minHeight: number = config.minHeight || 25;
    container.style.minWidth = `${minWidth}px`;
    container.style.maxWidth = `${window.innerWidth - 2 * VIEWPORT_MARGIN}px`;

    // The container is `position: fixed`, so every coordinate here is
    // relative to the viewport. A popover can therefore never make the
    // document larger or add a page scroll bar.
    const open_scroll_x = window.scrollX;
    const open_scroll_y = window.scrollY;

    // Anchor point: the popover's top-left corner goes here when it fits.
    // For `below`, `flip_bottom` is where the popover's bottom edge goes
    // when it has to sit above the element instead so it never covers what
    // it was opened from. For `leftOf`, `anchor_right` is where the
    // popover's right edge goes. Recomputed when the page scrolls, so the
    // popover follows the element it was opened from.
    let anchor_x = 0;
    let anchor_y = 0;
    let flip_bottom = 0;
    let anchor_right: number | null = null;
    // The last usable rectangle of each anchor element. An element that has
    // left the DOM or is not displayed (a re-rendered Player link, a
    // re-mounted button) reports an empty rectangle at (0, 0); the popover
    // then stays where it was.
    const last_rects = new Map<HTMLElement, DOMRect>();
    const rectOf = (elt: HTMLElement): DOMRect => {
        if (elt.isConnected) {
            const rectangle = elt.getBoundingClientRect();
            if (rectangle.width > 0 || rectangle.height > 0) {
                last_rects.set(elt, rectangle);
                return rectangle;
            }
        }
        return last_rects.get(elt) ?? elt.getBoundingClientRect();
    };
    const measureAnchor = () => {
        if (config.at) {
            anchor_x = config.at.x - (window.scrollX - open_scroll_x);
            anchor_y = config.at.y - (window.scrollY - open_scroll_y);
            flip_bottom = anchor_y;
        } else if (config.below) {
            const rectangle = rectOf(config.below);
            anchor_x = rectangle.left;
            anchor_y = rectangle.bottom;
            flip_bottom = rectangle.top;
        } else if (config.leftOf) {
            const rectangle = rectOf(config.leftOf);
            anchor_right = rectangle.left - LEFT_OF_GAP;
            anchor_y = (config.alignTop ? rectOf(config.alignTop) : rectangle).top;
        }
    };
    measureAnchor();

    // A popover taller than the viewport starts at the top margin and
    // scrolls inside its container. Content that draws its own box (border,
    // radius, shadow) can cap its height with `--popover-max-height` and
    // scroll inside that box, so the container never clips the box.
    const max_height = window.innerHeight - 2 * VIEWPORT_MARGIN;
    container.style.maxHeight = `${max_height}px`;
    container.style.setProperty("--popover-max-height", `${max_height}px`);

    // Place the container so that a popover of the given size stays inside
    // the viewport (with a small margin).
    const place = (width: number, height: number) => {
        const max_x = window.innerWidth - VIEWPORT_MARGIN - width;
        const min_y = VIEWPORT_MARGIN;
        const max_y = window.innerHeight - VIEWPORT_MARGIN;
        const left = anchor_right === null ? anchor_x : anchor_right - width;
        const x = Math.max(0, Math.min(left, max_x));
        container.style.left = `${x}px`;
        // Scroll only when the content overflows. Content that caps itself
        // at the maximum height fills the container without overflowing it,
        // and a scrolling container would clip the content's shadow.
        container.style.overflowY =
            height >= max_height && container.scrollHeight > container.clientHeight ? "auto" : "";

        // The top clamp covers every placement (`at`, `below`, `leftOf`):
        // no popover starts above the top margin of the viewport. An `at`
        // popover opened at y = 0 moves down to the margin.
        const setTop = (top: number) => {
            container.style.top = `${Math.max(min_y, top)}px`;
            container.style.bottom = "";
        };

        if (anchor_right !== null) {
            setTop(Math.min(anchor_y, max_y - height));
        } else if (anchor_y + height <= max_y) {
            setTop(anchor_y);
        } else if (flip_bottom - height >= min_y) {
            container.style.top = "";
            container.style.bottom = `${window.innerHeight - flip_bottom}px`;
        } else {
            setTop(min_y);
        }
    };

    // Place the container at its rendered size (the caller's minWidth /
    // minHeight are only a lower bound), then show it. The synchronous call
    // after the first render shows it only when the content has rendered.
    // ResizeObserver calls always show it, so content that renders nothing
    // does not leave an invisible popover whose backdrop blocks the page.
    // The container has no box of its own, so an empty one draws nothing.
    const placeMeasured = (show_empty: boolean) => {
        place(
            Math.max(container.offsetWidth, minWidth),
            Math.max(container.offsetHeight, minHeight),
        );
        if (show_empty || container.firstChild) {
            container.style.opacity = "";
            container.style.pointerEvents = "";
        }
    };

    place(minWidth, minHeight);

    document.body.appendChild(backdrop);
    document.body.appendChild(container);

    // Render synchronously so the content can be measured and placed before
    // the browser paints. flushSync also commits any pending synchronous
    // work of the caller's React root, so call popover() from an event
    // handler or an async callback, not during render or in an effect.
    // There flushSync cannot flush (React warns); the ResizeObserver below
    // then places and shows the popover, still before paint.
    const root = ReactDOM.createRoot(container);
    flushSync(() => {
        root.render(<React.StrictMode>{config.elt}</React.StrictMode>);
    });
    placeMeasured(false);

    const observer = new ResizeObserver(() => placeMeasured(true));
    // Border box, so a scroll bar that appears (see overflowY above) also
    // moves the popover.
    observer.observe(container, { box: "border-box" });

    // Follow the anchor when the page, or a scrolling element around the
    // anchor, scrolls. Other scrolls (the popover itself, a chat log, the
    // move tree) cannot move the anchor and do not force a layout read.
    const anchors = [config.below, config.leftOf, config.alignTop].filter(
        (elt): elt is HTMLElement => !!elt,
    );
    const onScroll = (ev: Event) => {
        const target = ev.target;
        const moves_anchor =
            target === document ||
            target === document.documentElement ||
            (!config.at &&
                target instanceof Node &&
                anchors.some((anchor) => target.contains(anchor)));
        if (!moves_anchor) {
            return;
        }
        measureAnchor();
        placeMeasured(true);
    };
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });

    const instance = new PopOver(config, backdrop, container, root);
    instance.on("close", () => {
        observer.disconnect();
        window.removeEventListener("scroll", onScroll, { capture: true });
    });
    return instance;
}
