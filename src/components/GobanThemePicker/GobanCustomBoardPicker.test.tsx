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
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { GobanCustomBoardPicker } from "./GobanThemePicker";

const flushMicrotasks = async () => {
    for (let i = 0; i < 10; ++i) {
        await Promise.resolve();
    }
};

const setNativeValue = (input: HTMLInputElement, value: string) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, value);
};

/* jsdom has no 2d canvas, so the sample board draws into a context that
 * does nothing. */
const fakeContext = new Proxy(
    {},
    {
        get: (_target, prop) => (prop === "measureText" ? () => ({ width: 1 }) : () => undefined),
        set: () => true,
    },
) as unknown as CanvasRenderingContext2D;

describe("GobanCustomBoardPicker", () => {
    const g = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    let act_environment: boolean | undefined;

    beforeEach(() => {
        act_environment = g.IS_REACT_ACT_ENVIRONMENT;
        data.set("user", { anonymous: true, id: 0 } as rest_api.UserConfig);
        jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => fakeContext);
    });
    afterEach(() => {
        g.IS_REACT_ACT_ENVIRONMENT = act_environment;
        jest.restoreAllMocks();
    });

    /* Dragging in a color picker sends a stream of input events. If the
     * browser handles them before React's scheduler task, only the
     * synchronous (discrete event) renders run, and React 19 throws
     * "Maximum update depth exceeded" when 50 of them in a row leave a
     * render pending. The loop below only flushes microtasks, so the
     * scheduler task does not run. */
    test("a stream of color input events does not leave renders pending", async () => {
        const { getByTitle } = render(<GobanCustomBoardPicker />);
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });
        const input = getByTitle("Board color") as HTMLInputElement;

        g.IS_REACT_ACT_ENVIRONMENT = false;
        const errors: unknown[] = [];
        const onError = (ev: ErrorEvent) => {
            errors.push(ev.error);
            ev.preventDefault();
        };
        window.addEventListener("error", onError);
        try {
            for (let i = 0; i < 120; ++i) {
                setNativeValue(input, `#${(0x100000 + i).toString(16)}`);
                input.dispatchEvent(new Event("input", { bubbles: true }));
                await flushMicrotasks();
            }
        } finally {
            window.removeEventListener("error", onError);
        }

        expect(errors).toEqual([]);
        expect(preferences.get("goban-theme-custom-board-background")).toBe("#100077");
    });
});
