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
import { act } from "react";
import { popover, PopOver } from "./popover";

type ResizeCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

let last_observer: MockResizeObserver | null = null;

class MockResizeObserver {
    public observed: Element[] = [];
    public disconnected = false;

    constructor(private readonly callback: ResizeCallback) {
        last_observer = this;
    }

    observe(elt: Element): void {
        this.observed.push(elt);
    }

    unobserve(): void {}

    disconnect(): void {
        this.disconnected = true;
    }

    trigger(): void {
        this.callback([], this as unknown as ResizeObserver);
    }
}

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 800;
const VIEWPORT_MARGIN = 16;

function makeAnchor(rect: { left: number; top: number; width: number; height: number }) {
    const button = document.createElement("button");
    button.getBoundingClientRect = () =>
        ({
            left: rect.left,
            top: rect.top,
            right: rect.left + rect.width,
            bottom: rect.top + rect.height,
            width: rect.width,
            height: rect.height,
            x: rect.left,
            y: rect.top,
            toJSON: () => ({}),
        }) as DOMRect;
    document.body.appendChild(button);
    return button;
}

function setRenderedSize(elt: HTMLElement, width: number, height: number): void {
    Object.defineProperty(elt, "offsetWidth", { configurable: true, value: width });
    Object.defineProperty(elt, "offsetHeight", { configurable: true, value: height });
}

describe("popover placement", () => {
    let instance: PopOver | null = null;

    beforeEach(() => {
        (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        (window as unknown as { ResizeObserver: unknown }).ResizeObserver = MockResizeObserver;
        Object.defineProperty(window, "innerWidth", { configurable: true, value: VIEWPORT_WIDTH });
        Object.defineProperty(window, "innerHeight", {
            configurable: true,
            value: VIEWPORT_HEIGHT,
        });
        last_observer = null;
    });

    afterEach(async () => {
        await act(async () => {
            instance?.close();
        });
        instance = null;
        document.body.innerHTML = "";
    });

    function open(anchor: HTMLElement, minWidth: number): HTMLElement {
        act(() => {
            instance = popover({ elt: <div>content</div>, below: anchor, minWidth });
        });
        return instance!.container;
    }

    test("keeps a popover wider than its minWidth inside the viewport", () => {
        // A gear button near the right side of a 1280px viewport. The
        // caller declares minWidth 320 but the rendered content ends up
        // 404px wide, which used to push the popover past the right edge.
        const anchor = makeAnchor({ left: 886, top: 748, width: 40, height: 40 });
        const container = open(anchor, 320);

        setRenderedSize(container, 404, 453);
        act(() => {
            last_observer?.trigger();
        });

        const left = parseFloat(container.style.left);
        expect(left + 404).toBeLessThanOrEqual(VIEWPORT_WIDTH - VIEWPORT_MARGIN);
        expect(left).toBeGreaterThanOrEqual(0);
    });

    test("stays anchored to the element when there is room", () => {
        const anchor = makeAnchor({ left: 100, top: 100, width: 40, height: 40 });
        const container = open(anchor, 320);

        setRenderedSize(container, 404, 453);
        act(() => {
            last_observer?.trigger();
        });

        expect(parseFloat(container.style.left)).toBe(100);
        expect(parseFloat(container.style.top)).toBe(140);
    });

    test("flips above the anchor when the rendered height does not fit below", () => {
        // Button 200px above the bottom edge: the declared minHeight (25)
        // fits below, but the real 453px content does not.
        const anchor = makeAnchor({ left: 100, top: 560, width: 40, height: 40 });
        const container = open(anchor, 320);

        setRenderedSize(container, 320, 453);
        act(() => {
            last_observer?.trigger();
        });

        expect(container.style.top).toBe("");
        expect(parseFloat(container.style.bottom)).toBe(VIEWPORT_HEIGHT - 560);
    });

    test("stops observing when closed", async () => {
        const anchor = makeAnchor({ left: 100, top: 100, width: 40, height: 40 });
        open(anchor, 320);
        const observer = last_observer;
        expect(observer).not.toBeNull();

        await act(async () => {
            instance?.close();
        });
        instance = null;

        expect(observer!.disconnected).toBe(true);
    });
});
