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

import { sidebarWidthBoundsPx } from "./SidebarResizer";

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

afterEach(() => {
    document.body.innerHTML = "";
});

describe("before layout has run, falling back to view width minus the aside", () => {
    test("leaves room for the board when there is no left aside", () => {
        // 1600 view - 0 aside - 384 board minimum (24rem at 16px)
        expect(sidebarWidthBoundsPx(makeRoot(1600)).max).toBe(1216);
    });

    test("subtracts the left aside as well as the board minimum", () => {
        expect(sidebarWidthBoundsPx(makeRoot(1600, { asideWidth: 300 })).max).toBe(916);
    });

    test("never reports a maximum below the minimum", () => {
        const bounds = sidebarWidthBoundsPx(makeRoot(500, { asideWidth: 300 }));
        expect(bounds.max).toBe(bounds.min);
    });
});

describe("once the board pane and sidebar have been measured", () => {
    test("the maximum is their combined width minus the board minimum", () => {
        // 900 center + 700 sidebar - 384 board minimum (24rem at 16px)
        const root = makeRoot(1600, { centerWidth: 900, sidebarWidth: 700 });
        expect(sidebarWidthBoundsPx(root).max).toBe(1216);
    });

    test("is unaffected by the left aside, since it is already excluded from the measured widths", () => {
        const withoutAside = makeRoot(1600, { centerWidth: 900, sidebarWidth: 700 });
        const withAside = makeRoot(1600, {
            asideWidth: 384,
            centerWidth: 900,
            sidebarWidth: 700,
        });
        expect(sidebarWidthBoundsPx(withAside).max).toBe(sidebarWidthBoundsPx(withoutAside).max);
    });

    test("never reports a maximum below the minimum", () => {
        const bounds = sidebarWidthBoundsPx(makeRoot(500, { centerWidth: 100, sidebarWidth: 100 }));
        expect(bounds.max).toBe(bounds.min);
    });
});
