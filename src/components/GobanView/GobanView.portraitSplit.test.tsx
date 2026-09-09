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
import { fireEvent, render } from "@testing-library/react";
import * as preferences from "@/lib/preferences";
import type { GobanController } from "@/lib/GobanController";
import { GobanView } from "./GobanView";

jest.mock("@/components/GobanContainer", () => ({
    __esModule: true,
    GobanContainer: () => <div data-testid="goban-container" />,
}));
jest.mock("./MoveNumberControl", () => ({
    __esModule: true,
    MoveNumberControl: () => <div data-testid="slider" />,
}));
jest.mock("@/lib/hooks", () => ({ useUser: () => ({ id: 1, anonymous: false }) }));

/** jsdom measures nothing, so the split would clamp every stored height to
 *  the board's minimum. Give the two elements the split divides a size, and
 *  the board the whole of the stage so the stage holds nothing else. */
const STAGE_HEIGHT = 600;
const PANELS_HEIGHT = 200;

function measure(element: HTMLElement): number {
    if (element.classList.contains("GobanView-stage")) {
        return STAGE_HEIGHT;
    }
    if (element.classList.contains("GobanView-mobile-panels")) {
        return PANELS_HEIGHT;
    }
    if (element.classList.contains("GobanView-center")) {
        return STAGE_HEIGHT;
    }
    return 0;
}

const original_descriptors = {
    offsetHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight"),
    clientHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight"),
    innerWidth: Object.getOwnPropertyDescriptor(window, "innerWidth"),
    innerHeight: Object.getOwnPropertyDescriptor(window, "innerHeight"),
};

beforeEach(() => {
    for (const property of ["offsetHeight", "clientHeight"]) {
        Object.defineProperty(HTMLElement.prototype, property, {
            configurable: true,
            get(this: HTMLElement) {
                return measure(this);
            },
        });
    }
    // `goban_view_mode` reads the window, and only a portrait view renders
    // the split at all.
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 400 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
});

afterEach(() => {
    for (const [property, descriptor] of Object.entries(original_descriptors)) {
        const target = property.startsWith("inner") ? window : HTMLElement.prototype;
        if (descriptor) {
            Object.defineProperty(target, property, descriptor);
        } else {
            delete (target as unknown as Record<string, unknown>)[property];
        }
    }
    preferences.set("goban-view-portrait-split", null);
});

function fakeController(): GobanController {
    return {
        goban: {
            config: { game_id: 100 },
            engine: {
                players: { black: { id: 1 }, white: { id: 2 } },
                playerColor: () => "invalid",
                rengo: false,
                cur_move: { move_number: 5 },
                last_official_move: { move_number: 5 },
            },
            on: jest.fn(),
            off: jest.fn(),
        },
        on: jest.fn(),
        off: jest.fn(),
    } as unknown as GobanController;
}

function renderSplit(): HTMLElement {
    const { container } = render(
        <GobanView controller={fakeController()} portraitSplit>
            <div />
        </GobanView>,
    );
    const stage = container.querySelector<HTMLElement>(".GobanView-stage");
    if (!stage) {
        throw new Error("the portrait split did not render a stage");
    }
    return stage;
}

test("the split renders in portrait", () => {
    expect(renderSplit().parentElement?.parentElement?.className).toContain("has-portrait-split");
});

test("a dragged height travels with flex-shrink: 0, so the panels give up the space", () => {
    // These two must be set together. With the height alone the stage stays
    // shrinkable, and it then loses the height to the panel area's flex basis
    // instead of taking it: the top of the handle's range becomes unreachable
    // and the board cannot be enlarged at all.
    preferences.set("goban-view-portrait-split", 500);

    const stage = renderSplit();

    expect(stage.style.height).toBe("500px");
    expect(stage.style.flexShrink).toBe("0");
});

test("a stored height too tall for the viewport is clamped, and still shrink-proof", () => {
    // 800 to share, less the panel area's 8rem floor.
    preferences.set("goban-view-portrait-split", 5000);

    const stage = renderSplit();

    expect(stage.style.height).toBe("672px");
    expect(stage.style.flexShrink).toBe("0");
});

test("no stored height leaves the stage with no inline style at all", () => {
    // This is what keeps the automatic layout on a squat viewport working.
    // Without a height of its own the stage must keep the CSS
    // `flex-shrink: 1`, so it and the panel area share a shortfall in
    // proportion and both stay on screen. An inline `flex-shrink: 0` here
    // would let the board push the panels off the bottom.
    expect(preferences.get("goban-view-portrait-split")).toBeNull();

    expect(renderSplit().getAttribute("style")).toBeNull();
});

describe("a drag that ends where it started", () => {
    /** jsdom has no PointerEvent, and the plain Event its absence falls back
     *  to carries none of the properties the handle reads. */
    class TestPointerEvent extends MouseEvent {
        readonly pointerId: number;

        constructor(type: string, init: MouseEventInit & { pointerId: number }) {
            super(type, { bubbles: true, ...init });
            this.pointerId = init.pointerId;
        }
    }

    function pointer(handle: HTMLElement, type: string, clientY: number): void {
        fireEvent(handle, new TestPointerEvent(type, { button: 0, clientY, pointerId: 1 }));
    }

    function renderView(): { root: HTMLElement; stage: HTMLElement; handle: HTMLElement } {
        const { container } = render(
            <GobanView controller={fakeController()} portraitSplit>
                <div />
            </GobanView>,
        );
        const root = container.querySelector<HTMLElement>(".GobanView");
        const stage = container.querySelector<HTMLElement>(".GobanView-stage");
        const handle = container.querySelector<HTMLElement>(".GobanView-portrait-splitter");
        if (!root || !stage || !handle) {
            throw new Error("the portrait split did not render");
        }
        return { root, stage, handle };
    }

    test("leaves nothing of the drag behind", () => {
        // Skipping the commit is only half of it: the preview is what puts the
        // inline height on the stage and the resize cursor on the whole view,
        // and only the end of the drag clears it.
        const { root, stage, handle } = renderView();

        pointer(handle, "pointerdown", 300);
        pointer(handle, "pointermove", 350);

        expect(root.className).toContain("is-resizing-stage");
        expect(stage.style.height).toBe("650px");

        pointer(handle, "pointermove", 300);
        pointer(handle, "pointerup", 300);

        expect(root.className).not.toContain("is-resizing-stage");
        expect(stage.style.height).toBe("");
        expect(stage.style.flexShrink).toBe("");
        expect(preferences.get("goban-view-portrait-split")).toBeNull();
    });

    test("leaves a stored height alone", () => {
        preferences.set("goban-view-portrait-split", 500);
        const { root, stage, handle } = renderView();

        pointer(handle, "pointerdown", 300);
        pointer(handle, "pointermove", 350);
        pointer(handle, "pointermove", 300);
        pointer(handle, "pointerup", 300);

        expect(root.className).not.toContain("is-resizing-stage");
        expect(stage.style.height).toBe("500px");
        expect(preferences.get("goban-view-portrait-split")).toBe(500);
    });
});

test("a consumer that does not ask for the split gets neither the class nor the handle", () => {
    preferences.set("goban-view-portrait-split", 500);

    const { container } = render(
        <GobanView controller={fakeController()}>
            <div />
        </GobanView>,
    );

    expect(container.querySelector(".has-portrait-split")).toBeNull();
    expect(container.querySelector(".GobanView-portrait-splitter")).toBeNull();
    expect(container.querySelector<HTMLElement>(".GobanView-stage")?.getAttribute("style")).toBe(
        null,
    );
});

describe("with no controller", () => {
    test("renders the placeholder, the tab bar, no board, no bars and no slider", () => {
        const { container } = render(
            <GobanView
                controller={null}
                centerPlaceholder={<div data-testid="placeholder" />}
                playerBars={false}
            >
                <div />
            </GobanView>,
        );
        expect(container.querySelector("[data-testid='placeholder']")).not.toBeNull();
        expect(container.querySelector(".GobanView-tab-bar")).not.toBeNull();
        expect(container.querySelector("[data-testid='goban-container']")).toBeNull();
        expect(container.querySelector("[data-testid='slider']")).toBeNull();
        expect(container.querySelector(".GobanView-player-bar")).toBeNull();
        expect(container.querySelector(".GobanView.has-no-board")).not.toBeNull();
    });

    test("follows the viewport across orientations", () => {
        // The GobanContainer is what normally reports resizes. Without one
        // the view kept whatever orientation it mounted with, so a room
        // between games rendered its portrait tree on a desktop.
        const { container } = render(
            <GobanView controller={null} centerPlaceholder={<div />} playerBars={false}>
                <div />
            </GobanView>,
        );
        expect(container.querySelector(".GobanView.portrait")).not.toBeNull();

        Object.defineProperty(window, "innerWidth", { configurable: true, value: 1600 });
        Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
        fireEvent(window, new Event("resize"));

        expect(container.querySelector(".GobanView.portrait")).toBeNull();
        expect(container.querySelector(".GobanView-sidebar")).not.toBeNull();
    });
});
