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

import { createEvent, fireEvent, render } from "@testing-library/react";
import * as React from "react";
import { resizableWidthBoundsPx, SidebarResizer } from "./SidebarResizer";

/** jsdom's `fireEvent.pointer*` helpers don't carry `clientX`/`pointerId`,
 *  so those two fields are set on a constructed event instead. */
function firePointerEvent(
    target: HTMLElement,
    type: "pointerDown" | "pointerMove" | "pointerUp",
    { pointerId, clientX }: { pointerId: number; clientX: number },
): void {
    const event = createEvent[type](target);
    Object.defineProperty(event, "pointerId", { value: pointerId });
    Object.defineProperty(event, "clientX", { value: clientX });
    Object.defineProperty(event, "button", { value: 0 });
    fireEvent(target, event);
}

interface RootChildWidths {
    asideWidth?: number;
    /** Omit both this and asideWidth's sibling `centerWidth`/`sidebarWidth`
     *  to simulate a root measured before layout has run, where the board
     *  pane and sidebar both report zero width. */
    centerWidth?: number;
    sidebarWidth?: number;
}

function addChild(root: HTMLElement, className: string, width: number): void {
    const child = document.createElement("div");
    child.className = className;
    Object.defineProperty(child, "offsetWidth", { value: width, configurable: true });
    root.appendChild(child);
}

function makeRoot(viewWidth: number, widths: RootChildWidths = {}): HTMLElement {
    const root = document.createElement("div");
    Object.defineProperty(root, "offsetWidth", { value: viewWidth, configurable: true });
    root.style.setProperty("--goban-view-sidebar-width", "400px");
    if (widths.asideWidth !== undefined) {
        addChild(root, "GobanView-left-aside", widths.asideWidth);
    }
    if (widths.centerWidth !== undefined) {
        addChild(root, "GobanView-center", widths.centerWidth);
    }
    if (widths.sidebarWidth !== undefined) {
        addChild(root, "GobanView-sidebar", widths.sidebarWidth);
    }
    document.body.appendChild(root);
    return root;
}

function sidebarBounds(root: HTMLElement): { min: number; max: number } {
    return resizableWidthBoundsPx(
        root,
        root.querySelector<HTMLElement>(".GobanView-sidebar"),
        "--goban-view-sidebar-width",
    );
}

afterEach(() => {
    document.body.innerHTML = "";
});

describe("before layout has run, falling back to view width minus the aside", () => {
    test("leaves room for the board when there is no left aside", () => {
        // 1600 view - 0 aside - 384 board minimum (24rem at 16px)
        expect(sidebarBounds(makeRoot(1600)).max).toBe(1216);
    });

    test("subtracts the left aside as well as the board minimum", () => {
        expect(sidebarBounds(makeRoot(1600, { asideWidth: 300 })).max).toBe(916);
    });

    test("never reports a maximum below the minimum", () => {
        const bounds = sidebarBounds(makeRoot(500, { asideWidth: 300 }));
        expect(bounds.max).toBe(bounds.min);
    });
});

describe("once the board pane and sidebar have been measured", () => {
    test("the maximum is their combined width minus the board minimum", () => {
        // 900 center + 700 sidebar - 384 board minimum (24rem at 16px)
        const root = makeRoot(1600, { centerWidth: 900, sidebarWidth: 700 });
        expect(sidebarBounds(root).max).toBe(1216);
    });

    test("is unaffected by the left aside, since it is already excluded from the measured widths", () => {
        const withoutAside = makeRoot(1600, { centerWidth: 900, sidebarWidth: 700 });
        const withAside = makeRoot(1600, {
            asideWidth: 384,
            centerWidth: 900,
            sidebarWidth: 700,
        });
        expect(sidebarBounds(withAside).max).toBe(sidebarBounds(withoutAside).max);
    });

    test("never reports a maximum below the minimum", () => {
        const bounds = sidebarBounds(makeRoot(500, { centerWidth: 100, sidebarWidth: 100 }));
        expect(bounds.max).toBe(bounds.min);
    });
});

describe("the left aside bounds", () => {
    test("the maximum is the aside and board pane widths minus the board minimum", () => {
        const root = makeRoot(1600, { asideWidth: 400, centerWidth: 900, sidebarWidth: 400 });
        root.style.setProperty("--goban-view-left-aside-width", "384px");
        const aside = root.querySelector<HTMLElement>(".GobanView-left-aside");
        // 400 aside + 900 center - 384 board minimum (24rem at 16px)
        expect(resizableWidthBoundsPx(root, aside, "--goban-view-left-aside-width")).toEqual({
            min: 384,
            max: 916,
        });
    });
});

describe("dragging", () => {
    function renderHandle(edge: "start" | "end") {
        const root = makeRoot(1600, { asideWidth: 400, centerWidth: 900, sidebarWidth: 400 });
        root.style.setProperty("--goban-view-left-aside-width", "384px");
        const target = root.querySelector<HTMLDivElement>(
            edge === "end" ? ".GobanView-left-aside" : ".GobanView-sidebar",
        );
        const rootRef = { current: root as HTMLDivElement };
        const targetRef = { current: target };
        const onPreview = jest.fn();
        const onCommit = jest.fn();
        const { container } = render(
            <SidebarResizer
                rootRef={rootRef}
                targetRef={targetRef}
                edge={edge}
                minWidthVar={
                    edge === "end" ? "--goban-view-left-aside-width" : "--goban-view-sidebar-width"
                }
                label="Resize"
                onPreview={onPreview}
                onCommit={onCommit}
            />,
        );
        const handle = container.querySelector<HTMLElement>(".GobanView-sidebar-resizer")!;
        return { handle, onPreview, onCommit };
    }

    test("an end-edge handle widens its target when dragged right", () => {
        const { handle, onCommit } = renderHandle("end");
        firePointerEvent(handle, "pointerDown", { pointerId: 1, clientX: 500 });
        firePointerEvent(handle, "pointerMove", { pointerId: 1, clientX: 550 });
        firePointerEvent(handle, "pointerUp", { pointerId: 1, clientX: 550 });
        expect(onCommit).toHaveBeenCalledWith(450);
    });

    test("a start-edge handle widens its target when dragged left", () => {
        const { handle, onCommit } = renderHandle("start");
        firePointerEvent(handle, "pointerDown", { pointerId: 1, clientX: 500 });
        firePointerEvent(handle, "pointerMove", { pointerId: 1, clientX: 450 });
        firePointerEvent(handle, "pointerUp", { pointerId: 1, clientX: 450 });
        expect(onCommit).toHaveBeenCalledWith(450);
    });

    test("ArrowRight widens an end-edge target", () => {
        const { handle, onCommit } = renderHandle("end");
        fireEvent.keyDown(handle, { key: "ArrowRight" });
        expect(onCommit).toHaveBeenCalledWith(416);
    });
});
