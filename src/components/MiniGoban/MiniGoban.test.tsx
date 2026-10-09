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
import { act, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MiniGoban } from "./MiniGoban";

type ResizeCallback = (entries: Array<{ contentRect: DOMRectReadOnly }>) => void;

interface GobanStub {
    display_width: number;
    setSquareSizeBasedOnDisplayWidth: jest.Mock;
    on: jest.Mock;
    off: jest.Mock;
    destroy: jest.Mock;
    engine: Record<string, never>;
}

const created_gobans: GobanStub[] = [];

jest.mock("@/lib/GobanController", () => ({
    __esModule: true,
    GobanController: jest.fn().mockImplementation((config: { display_width: number }) => {
        const goban: GobanStub = {
            display_width: config.display_width,
            setSquareSizeBasedOnDisplayWidth: jest.fn((width: number) => {
                goban.display_width = width;
            }),
            on: jest.fn(),
            off: jest.fn(),
            destroy: jest.fn(),
            engine: {},
        };
        created_gobans.push(goban);
        return { goban };
    }),
}));

const observed: Element[] = [];
let resize_callback: ResizeCallback | null = null;
const original_resize_observer = window.ResizeObserver;

function setRootFontSize(px: number) {
    document.documentElement.style.fontSize = `${px}px`;
}

function fireResize() {
    act(() => {
        resize_callback?.([{ contentRect: { width: 1, height: 1 } as DOMRectReadOnly }]);
    });
}

function renderMiniGoban(extra: Partial<React.ComponentProps<typeof MiniGoban>> = {}) {
    return render(
        <MemoryRouter>
            <MiniGoban game_id={1} width={19} height={19} noText {...extra} />
        </MemoryRouter>,
    );
}

beforeEach(() => {
    created_gobans.length = 0;
    observed.length = 0;
    resize_callback = null;
    window.ResizeObserver = class {
        constructor(cb: ResizeCallback) {
            resize_callback = cb;
        }
        observe(element: Element) {
            observed.push(element);
        }
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;
    Object.defineProperty(window, "innerWidth", { value: 1920, configurable: true });
    window.dispatchEvent(new Event("resize"));
    setRootFontSize(20);
});

afterEach(() => {
    window.ResizeObserver = original_resize_observer;
    document.documentElement.style.fontSize = "";
});

describe("MiniGoban board sizing", () => {
    // 19rem: the padded card around the board must fit inside the 22rem cell.
    it("sizes the board to 19rem of the root font-size at mount", () => {
        renderMiniGoban();

        expect(created_gobans).toHaveLength(1);
        expect(created_gobans[0].display_width).toBe(380);
    });

    it("resizes the board when the root font-size changes after mount", () => {
        renderMiniGoban();
        const goban = created_gobans[0];

        setRootFontSize(16);
        fireResize();

        expect(goban.setSquareSizeBasedOnDisplayWidth).toHaveBeenCalledWith(304);
    });

    it("leaves the board alone when its cell resizes without a font-size change", () => {
        renderMiniGoban();
        const goban = created_gobans[0];

        fireResize();

        expect(goban.setSquareSizeBasedOnDisplayWidth).not.toHaveBeenCalled();
    });

    it("sizes the card box from the board's display width", () => {
        const { container } = renderMiniGoban();

        expect(container.querySelector<HTMLElement>(".board")?.style.width).toBe("380px");
        expect(container.querySelector<HTMLElement>(".board")?.style.height).toBe("380px");
    });

    it("keeps the card box in step with the board after a root font-size change", () => {
        const { container } = renderMiniGoban();

        setRootFontSize(16);
        fireResize();

        expect(container.querySelector<HTMLElement>(".board")?.style.width).toBe("304px");
    });

    it("keeps the card box inside a viewport narrower than 19rem", () => {
        Object.defineProperty(window, "innerWidth", { value: 300, configurable: true });
        window.dispatchEvent(new Event("resize"));
        const { container } = renderMiniGoban();

        expect(created_gobans[0].display_width).toBe(300);
        expect(container.querySelector<HTMLElement>(".board")?.style.width).toBe("300px");
    });

    it("leaves the card box alone when given an explicit displayWidth", () => {
        const { container } = renderMiniGoban({ displayWidth: 250 });

        expect(container.querySelector<HTMLElement>(".board")?.style.width).toBe("");
    });

    it("marks itself default-size when it computes its own width", () => {
        const { container } = renderMiniGoban();

        expect(container.querySelector(".MiniGoban")).toHaveClass("default-size");
    });

    it("is not default-size when given an explicit displayWidth", () => {
        const { container } = renderMiniGoban({ displayWidth: 250 });

        expect(container.querySelector(".MiniGoban")).not.toHaveClass("default-size");
    });

    it("keeps an explicit displayWidth prop in charge of the board size", () => {
        renderMiniGoban({ displayWidth: 250 });
        const goban = created_gobans[0];

        setRootFontSize(16);
        fireResize();

        expect(goban.setSquareSizeBasedOnDisplayWidth).not.toHaveBeenCalledWith(304);
        expect(goban.display_width).toBe(250);
    });
});
