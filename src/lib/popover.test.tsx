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
import * as fs from "fs";
import * as path from "path";
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

function setScrollSize(elt: HTMLElement, scroll_height: number, client_height: number): void {
    Object.defineProperty(elt, "scrollHeight", { configurable: true, value: scroll_height });
    Object.defineProperty(elt, "clientHeight", { configurable: true, value: client_height });
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

    test("a flipped popover never goes above the viewport top", () => {
        // Anchor near the top and near the bottom: no room below, and the
        // content is taller than the space above the anchor.
        const anchor = makeAnchor({ left: 100, top: 300, width: 40, height: 460 });
        const container = open(anchor, 320);

        setRenderedSize(container, 320, 453);
        act(() => {
            last_observer?.trigger();
        });

        expect(container.style.bottom).toBe("");
        expect(parseFloat(container.style.top)).toBe(VIEWPORT_MARGIN);
    });

    function openLeftOf(anchor: HTMLElement, minWidth: number): HTMLElement {
        act(() => {
            instance = popover({ elt: <div>content</div>, leftOf: anchor, minWidth });
        });
        return instance!.container;
    }

    test("leftOf puts the right edge at the element's left edge, tops aligned", () => {
        const anchor = makeAnchor({ left: 1200, top: 200, width: 32, height: 32 });
        const container = openLeftOf(anchor, 320);

        setRenderedSize(container, 404, 453);
        act(() => {
            last_observer?.trigger();
        });

        const left = parseFloat(container.style.left);
        expect(left + 404).toBeLessThanOrEqual(1200);
        expect(left + 404).toBeGreaterThan(1200 - VIEWPORT_MARGIN);
        expect(parseFloat(container.style.top)).toBe(200);
    });

    test("alignTop aligns the top of a leftOf popover with another element", () => {
        const column = makeAnchor({ left: 1200, top: 100, width: 32, height: 600 });
        const row = makeAnchor({ left: 1000, top: 250, width: 232, height: 32 });
        act(() => {
            instance = popover({
                elt: <div>content</div>,
                leftOf: column,
                alignTop: row,
                minWidth: 320,
            });
        });
        const container = instance!.container;

        setRenderedSize(container, 404, 300);
        act(() => {
            last_observer?.trigger();
        });

        expect(parseFloat(container.style.left) + 404).toBeLessThanOrEqual(1200);
        expect(parseFloat(container.style.top)).toBe(250);
    });

    test("leftOf moves the popover up so its bottom stays inside the viewport", () => {
        const anchor = makeAnchor({ left: 1200, top: 600, width: 32, height: 32 });
        const container = openLeftOf(anchor, 320);

        setRenderedSize(container, 404, 453);
        act(() => {
            last_observer?.trigger();
        });

        expect(parseFloat(container.style.top)).toBe(VIEWPORT_HEIGHT - VIEWPORT_MARGIN - 453);
    });

    test("leftOf keeps the top of the popover inside the viewport", () => {
        // An element that is partly above the top of the viewport.
        const anchor = makeAnchor({ left: 1200, top: -40, width: 32, height: 32 });
        const container = openLeftOf(anchor, 320);

        setRenderedSize(container, 404, 300);
        act(() => {
            last_observer?.trigger();
        });

        expect(parseFloat(container.style.top)).toBe(VIEWPORT_MARGIN);
    });

    test("a popover taller than the viewport starts at the margin and scrolls", () => {
        const anchor = makeAnchor({ left: 1200, top: 400, width: 32, height: 32 });
        const container = openLeftOf(anchor, 320);

        setRenderedSize(container, 404, VIEWPORT_HEIGHT - 2 * VIEWPORT_MARGIN);
        setScrollSize(container, VIEWPORT_HEIGHT, VIEWPORT_HEIGHT - 2 * VIEWPORT_MARGIN);
        act(() => {
            last_observer?.trigger();
        });

        expect(parseFloat(container.style.top)).toBe(VIEWPORT_MARGIN);
        expect(container.style.maxHeight).toBe(`${VIEWPORT_HEIGHT - 2 * VIEWPORT_MARGIN}px`);
        expect(container.style.overflowY).toBe("auto");
    });

    test("content capped at the maximum height does not make the container scroll", () => {
        const anchor = makeAnchor({ left: 1200, top: 400, width: 32, height: 32 });
        const container = openLeftOf(anchor, 320);
        const max_height = VIEWPORT_HEIGHT - 2 * VIEWPORT_MARGIN;

        expect(container.style.getPropertyValue("--popover-max-height")).toBe(`${max_height}px`);

        setRenderedSize(container, 404, max_height);
        setScrollSize(container, max_height, max_height);
        act(() => {
            last_observer?.trigger();
        });

        expect(parseFloat(container.style.top)).toBe(VIEWPORT_MARGIN);
        expect(container.style.overflowY).toBe("");
    });

    test("a popover that fits does not scroll", () => {
        const anchor = makeAnchor({ left: 100, top: 100, width: 32, height: 32 });
        const container = open(anchor, 320);

        setRenderedSize(container, 320, 200);
        setScrollSize(container, 200, 200);
        act(() => {
            last_observer?.trigger();
        });

        expect(container.style.overflowY).toBe("");
    });

    test("an `at` popover near the top of the page moves down to the margin", () => {
        act(() => {
            instance = popover({ elt: <div>content</div>, at: { x: 0, y: 0 }, minWidth: 320 });
        });
        const container = instance!.container;

        setRenderedSize(container, 320, 200);
        act(() => {
            last_observer?.trigger();
        });

        expect(parseFloat(container.style.top)).toBe(VIEWPORT_MARGIN);
        expect(parseFloat(container.style.left)).toBe(0);
    });

    test("the container is hidden until it is placed, and shown after", () => {
        const style_at_mount: string[] = [];
        const Probe = () => {
            const ref = React.useCallback((elt: HTMLDivElement | null) => {
                if (elt?.parentElement) {
                    const style = elt.parentElement.style;
                    style_at_mount.push(`${style.opacity}/${style.pointerEvents}`);
                }
            }, []);
            return <div ref={ref}>content</div>;
        };
        const anchor = makeAnchor({ left: 100, top: 100, width: 40, height: 40 });
        act(() => {
            instance = popover({ elt: <Probe />, below: anchor, minWidth: 320 });
        });

        expect(style_at_mount[0]).toBe("0/none");
        expect(instance!.container.style.opacity).toBe("");
        expect(instance!.container.style.pointerEvents).toBe("");
    });

    test("a tall popover near the top is inside the viewport when it is shown", () => {
        const height = 740;
        const offset_height = Object.getOwnPropertyDescriptor(
            HTMLElement.prototype,
            "offsetHeight",
        );
        Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
            configurable: true,
            get(this: HTMLElement) {
                return this.classList.contains("popover-container") ? height : 0;
            },
        });
        try {
            const anchor = makeAnchor({ left: 100, top: 20, width: 40, height: 40 });
            act(() => {
                instance = popover({ elt: <div>content</div>, below: anchor, minWidth: 320 });
            });
            const container = instance!.container;
            expect(container.style.opacity).toBe("");
            const top_when_shown = container.style.top;
            const bottom_when_shown = container.style.bottom;

            const top = parseFloat(top_when_shown);
            expect(bottom_when_shown).toBe("");
            expect(top).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
            expect(top + height).toBeLessThanOrEqual(VIEWPORT_HEIGHT - VIEWPORT_MARGIN);

            // The ResizeObserver does not move a popover that is already placed.
            act(() => {
                last_observer?.trigger();
            });
            expect(container.style.top).toBe(top_when_shown);
        } finally {
            if (offset_height) {
                Object.defineProperty(HTMLElement.prototype, "offsetHeight", offset_height);
            }
        }
    });

    test("uses fixed positioning in viewport coordinates", () => {
        const css = fs.readFileSync(path.join(__dirname, "popover.css"), "utf8");
        const rule = css.match(/\.popover-container\s*\{[^}]*\}/);
        expect(rule?.[0]).toMatch(/position:\s*fixed;/);

        // The page is scrolled: the anchor's viewport position is used as is.
        Object.defineProperty(window, "scrollY", { configurable: true, value: 500 });
        try {
            const anchor = makeAnchor({ left: 100, top: 100, width: 40, height: 40 });
            const container = open(anchor, 320);
            expect(parseFloat(container.style.top)).toBe(140);
        } finally {
            Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
        }
    });

    test("follows the anchor when the page scrolls", () => {
        let top = 100;
        const anchor = makeAnchor({ left: 100, top: 100, width: 40, height: 40 });
        anchor.getBoundingClientRect = () =>
            ({ left: 100, top, right: 140, bottom: top + 40, width: 40, height: 40 }) as DOMRect;
        const container = open(anchor, 320);
        expect(parseFloat(container.style.top)).toBe(140);

        top = 50;
        scrollDocument();
        expect(parseFloat(container.style.top)).toBe(90);
    });

    function movableAnchor(top: { value: number }): HTMLElement {
        const anchor = makeAnchor({ left: 100, top: top.value, width: 40, height: 40 });
        anchor.getBoundingClientRect = () =>
            ({
                left: 100,
                top: top.value,
                right: 140,
                bottom: top.value + 40,
                width: 40,
                height: 40,
            }) as DOMRect;
        return anchor;
    }

    function scrollDocument(): void {
        act(() => {
            document.dispatchEvent(new Event("scroll"));
        });
    }

    function scrollElement(elt: Element): void {
        act(() => {
            elt.dispatchEvent(new Event("scroll"));
        });
    }

    test("stops following the anchor after it is closed", async () => {
        const top = { value: 100 };
        const container = open(movableAnchor(top), 320);
        expect(container.style.top).toBe("140px");

        await act(async () => {
            instance?.close();
        });
        instance = null;

        top.value = 50;
        scrollDocument();
        expect(container.style.top).toBe("140px");
    });

    test("a scroll inside the popover does not move it", () => {
        const top = { value: 100 };
        const container = open(movableAnchor(top), 320);

        top.value = 50;
        scrollElement(container.firstElementChild ?? container);
        expect(container.style.top).toBe("140px");
    });

    test("a scroll of an element that does not hold the anchor does not move it", () => {
        const top = { value: 100 };
        const container = open(movableAnchor(top), 320);
        const chat_log = document.createElement("div");
        document.body.appendChild(chat_log);

        top.value = 50;
        scrollElement(chat_log);
        expect(container.style.top).toBe("140px");
    });

    test("a scroll of an element that holds the anchor moves it", () => {
        const top = { value: 100 };
        const list = document.createElement("div");
        document.body.appendChild(list);
        const anchor = movableAnchor(top);
        list.appendChild(anchor);
        const container = open(anchor, 320);

        top.value = 50;
        scrollElement(list);
        expect(container.style.top).toBe("90px");
    });

    test("an `at` popover moves with the page scroll", () => {
        act(() => {
            instance = popover({ elt: <div>content</div>, at: { x: 200, y: 300 }, minWidth: 320 });
        });
        const container = instance!.container;
        expect(container.style.top).toBe("300px");

        Object.defineProperty(window, "scrollY", { configurable: true, value: 100 });
        try {
            scrollDocument();
            expect(container.style.top).toBe("200px");
            expect(container.style.left).toBe("200px");

            // Element scrolls do not move an `at` popover.
            const list = document.createElement("div");
            document.body.appendChild(list);
            Object.defineProperty(window, "scrollY", { configurable: true, value: 150 });
            scrollElement(list);
            expect(container.style.top).toBe("200px");
        } finally {
            Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
        }
    });

    test("an anchor that is removed or not displayed keeps the last position", () => {
        const top = { value: 100 };
        const anchor = movableAnchor(top);
        const container = open(anchor, 320);
        expect(container.style.top).toBe("140px");
        expect(container.style.left).toBe("100px");

        // Not displayed: an empty rectangle at (0, 0).
        anchor.getBoundingClientRect = () =>
            ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }) as DOMRect;
        scrollDocument();
        expect(container.style.top).toBe("140px");
        expect(container.style.left).toBe("100px");

        // Removed from the DOM.
        anchor.remove();
        scrollDocument();
        expect(container.style.top).toBe("140px");
        expect(container.style.left).toBe("100px");
    });

    test("content that renders nothing is shown after the first resize callback", () => {
        const Empty = () => null;
        act(() => {
            instance = popover({ elt: <Empty />, at: { x: 100, y: 100 } });
        });
        const container = instance!.container;
        expect(container.style.opacity).toBe("0");

        act(() => {
            last_observer?.trigger();
        });
        expect(container.style.opacity).toBe("");
        expect(container.style.pointerEvents).toBe("");
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
