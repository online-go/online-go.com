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
import { useRootWidth } from "./useRootWidth";

type ResizeCallback = (entries: { contentRect: { width: number; height: number } }[]) => void;

const observed: Element[] = [];
let callback: ResizeCallback | null = null;
const original_resize_observer = window.ResizeObserver;

beforeEach(() => {
    observed.length = 0;
    callback = null;
    window.ResizeObserver = class {
        constructor(cb: ResizeCallback) {
            callback = cb;
        }
        observe(element: Element) {
            observed.push(element);
        }
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;
});

afterEach(() => {
    window.ResizeObserver = original_resize_observer;
});

function Probe({ mounted }: { mounted: boolean }): React.ReactElement {
    const ref = React.useRef<HTMLDivElement>(null);
    const width = useRootWidth(ref);
    return (
        <>
            <span data-testid="width">{width}</span>
            {mounted && <div ref={ref} data-testid="root" />}
        </>
    );
}

test("observes the element once it mounts after the first render", () => {
    const { rerender, getByTestId } = render(<Probe mounted={false} />);
    expect(observed).toHaveLength(0);

    rerender(<Probe mounted={true} />);
    expect(observed).toEqual([getByTestId("root")]);

    act(() => callback?.([{ contentRect: { width: 777, height: 500 } }]));
    expect(getByTestId("width").textContent).toBe("777");
});

test("observes an element that is there on the first render", () => {
    const { getByTestId } = render(<Probe mounted={true} />);
    expect(observed).toEqual([getByTestId("root")]);
});
