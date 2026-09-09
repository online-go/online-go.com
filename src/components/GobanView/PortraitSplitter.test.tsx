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
import { PortraitSplitter } from "./PortraitSplitter";
import {
    clampPortraitStage,
    portraitAvailableHeightPx,
    portraitStageBoundsPx,
    portraitStageExtraHeightPx,
} from "./resizerUtil";

function makeElement(height: number, className: string = ""): HTMLDivElement {
    const element = document.createElement("div");
    element.className = className;
    Object.defineProperty(element, "offsetHeight", { value: height, configurable: true });
    Object.defineProperty(element, "clientHeight", { value: height, configurable: true });
    return element;
}

/** A stage holding a board and, above and below it, whatever the consumer
 *  asked for: two 58px player bars here. */
function makeStage(children: HTMLElement[]): HTMLElement {
    const stage = makeElement(0);
    for (const child of children) {
        stage.appendChild(child);
    }
    return stage;
}

test("keeps the panel area its minimum", () => {
    // 800 available, 8rem (128px) reserved for the panels
    expect(portraitStageBoundsPx(800).max).toBe(672);
});

test("keeps the board its minimum", () => {
    expect(portraitStageBoundsPx(800).min).toBe(128);
});

describe("the stage floor makes room for what the stage holds besides the board", () => {
    test("counts every child of the stage except the board", () => {
        const stage = makeStage([
            makeElement(58, "GobanView-player-bar top"),
            makeElement(400, "GobanView-center"),
            makeElement(58, "GobanView-player-bar bottom"),
        ]);
        expect(portraitStageExtraHeightPx(stage)).toBe(116);
    });

    test("counts the aboveBoard and belowBoard slots as well", () => {
        const stage = makeStage([
            makeElement(40, "GobanView-above-board"),
            makeElement(400, "GobanView-center"),
            makeElement(90, "GobanView-below-board"),
        ]);
        expect(portraitStageExtraHeightPx(stage)).toBe(130);
    });

    test("is nothing for a consumer whose stage is only the board", () => {
        expect(portraitStageExtraHeightPx(makeStage([makeElement(400, "GobanView-center")]))).toBe(
            0,
        );
    });

    test("is nothing before the stage exists", () => {
        expect(portraitStageExtraHeightPx(null)).toBe(0);
    });

    test("raises the minimum by what those children measure", () => {
        // 8rem of board plus two 58px player bars
        expect(portraitStageBoundsPx(800, 116).min).toBe(244);
    });

    test("does not let a stored height clip them away", () => {
        expect(clampPortraitStage(10, 800, 116)).toBe(244);
    });

    test("leaves the panel minimum where it was", () => {
        expect(portraitStageBoundsPx(800, 116).max).toBe(672);
    });

    test("reports no range at all on a viewport too short for both minimums", () => {
        const bounds = portraitStageBoundsPx(500, 300);
        expect(bounds.min).toBe(428);
        expect(bounds.max).toBe(bounds.min);
    });
});

test("never reports a maximum below the minimum on a squat viewport", () => {
    const bounds = portraitStageBoundsPx(200);
    expect(bounds.max).toBe(bounds.min);
});

test("clamps a stored height from a taller screen", () => {
    expect(clampPortraitStage(1400, 800)).toBe(672);
});

test("clamps a stored height that would hide the board", () => {
    expect(clampPortraitStage(10, 800)).toBe(128);
});

describe("the height the stage and the panels share", () => {
    test("is what the two of them measure together", () => {
        expect(
            portraitAvailableHeightPx(makeElement(400), makeElement(242), makeElement(800)),
        ).toBe(642);
    });

    test("measures the column, less the handle, when the panels have nothing left", () => {
        // A stage at the top of its range can take every pixel the panels
        // had. Reading the view height here would overstate the shared space
        // by everything outside the column, and the maximum computed from it
        // would keep handing the stage the height that emptied them.
        const column = makeElement(800);
        const stage = makeElement(786);
        column.append(stage, makeElement(14), makeElement(0));
        const panels = column.children[2] as HTMLElement;
        expect(portraitAvailableHeightPx(stage, panels, makeElement(920))).toBe(786);
    });

    test("falls back to the view height before layout has run", () => {
        expect(portraitAvailableHeightPx(makeElement(0), makeElement(0), makeElement(800))).toBe(
            800,
        );
    });

    test("falls back to the view height when the column has no size either", () => {
        const column = makeElement(0);
        const stage = makeElement(0);
        const panels = makeElement(0);
        column.append(stage, panels);
        expect(portraitAvailableHeightPx(stage, panels, makeElement(800))).toBe(800);
    });
});

describe("the handle", () => {
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

    /** A 400px stage beside a 200px panel area, so the range is 128..472. */
    function renderHandle(): {
        handle: HTMLElement;
        onCommit: jest.Mock;
        onCancel: jest.Mock;
        onPreview: jest.Mock;
    } {
        const stage = makeElement(400, "GobanView-stage");
        const panels = makeElement(200, "GobanView-mobile-panels");
        const root = makeElement(800);
        root.append(stage, panels);
        const onCommit = jest.fn();
        const onCancel = jest.fn();
        const onPreview = jest.fn();
        const { container } = render(
            <PortraitSplitter
                rootRef={{ current: root }}
                stageRef={{ current: stage }}
                panelsRef={{ current: panels }}
                onPreview={onPreview}
                onCommit={onCommit}
                onCancel={onCancel}
            />,
        );
        const handle = container.querySelector<HTMLElement>(".GobanView-portrait-splitter");
        if (!handle) {
            throw new Error("the splitter did not render a handle");
        }
        return { handle, onCommit, onCancel, onPreview };
    }

    test("commits the height a drag ends on", () => {
        const { handle, onCommit, onCancel } = renderHandle();

        pointer(handle, "pointerdown", 300);
        pointer(handle, "pointermove", 350);
        pointer(handle, "pointerup", 350);

        expect(onCommit).toHaveBeenCalledWith(450);
        expect(onCancel).not.toHaveBeenCalled();
    });

    test("cancels instead of committing when a tap does not move the handle", () => {
        // Committing here would turn an automatic split into a pinned one.
        const { handle, onCommit, onCancel } = renderHandle();

        pointer(handle, "pointerdown", 300);
        pointer(handle, "pointerup", 300);

        expect(onCommit).not.toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalled();
    });

    test("cancels when a drag returns to the height it started at", () => {
        // The preview is live by now, and only ending the drag drops it.
        const { handle, onCommit, onCancel, onPreview } = renderHandle();

        pointer(handle, "pointerdown", 300);
        pointer(handle, "pointermove", 350);
        pointer(handle, "pointermove", 300);
        pointer(handle, "pointerup", 300);

        expect(onPreview).toHaveBeenCalled();
        expect(onCommit).not.toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalled();
    });

    test("cancels when every move clamps back to the height the drag started at", () => {
        // A drag that starts at a limit of the range: each move is clamped to
        // the height it started from, so the drag ends where it began.
        const { handle, onCommit, onCancel } = renderHandle();

        pointer(handle, "pointerdown", 300);
        pointer(handle, "pointermove", 300);
        pointer(handle, "pointerup", 300);

        expect(onCommit).not.toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalled();
    });

    test("a cancelled drag also ends it", () => {
        const { handle, onCommit, onCancel } = renderHandle();

        pointer(handle, "pointerdown", 300);
        pointer(handle, "pointermove", 350);
        pointer(handle, "pointermove", 300);
        pointer(handle, "pointercancel", 300);

        expect(onCommit).not.toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalled();
    });

    test("a double-click still resets the split", () => {
        const { handle, onCommit } = renderHandle();

        fireEvent.doubleClick(handle);

        expect(onCommit).toHaveBeenCalledWith(null);
    });
});
