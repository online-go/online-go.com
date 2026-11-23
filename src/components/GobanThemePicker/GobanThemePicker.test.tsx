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
import { Goban } from "goban";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import {
    GobanBlackThemePicker,
    GobanCustomBlackPicker,
    GobanWhiteThemePicker,
} from "./GobanThemePicker";

interface ImageDataCall {
    w: number;
    h: number;
}

const image_data_calls: ImageDataCall[] = [];

const makeImageData = (w: number, h: number) => {
    const length = Number.isFinite(w) && Number.isFinite(h) ? Math.max(0, w * h * 4) : 0;
    return { data: new Uint8ClampedArray(length), width: w, height: h, colorSpace: "srgb" };
};

/* jsdom has no 2d canvas. This context does nothing, but it reports no
 * backing store pixel ratio (so goban's scaling ratio is 1, not NaN) and it
 * returns real pixel buffers, so the rendered stone themes run their normal
 * pixel loops. */
const fakeContext = new Proxy(
    {},
    {
        get: (_target, prop) => {
            if (typeof prop === "symbol") {
                return undefined;
            }
            if (prop === "canvas" || prop.endsWith("PixelRatio")) {
                return undefined;
            }
            if (prop === "getImageData") {
                return (...args: number[]) => {
                    const w = args[2];
                    const h = args[3];
                    image_data_calls.push({ w, h });
                    return makeImageData(w, h);
                };
            }
            if (prop === "createImageData") {
                return (...args: number[]) => makeImageData(args[0], args[1]);
            }
            if (prop === "measureText") {
                return () => ({ width: 1 });
            }
            return () => undefined;
        },
        set: () => true,
    },
) as unknown as CanvasRenderingContext2D;

const flushEffects = async () => {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
};

const hostsWithSvg = (container: HTMLElement): HTMLElement[] =>
    Array.from(container.querySelectorAll(".selector")).filter(
        (selector): selector is HTMLElement =>
            selector instanceof HTMLElement && selector.querySelector("svg") !== null,
    );

/* Chrome 80-85 and other old engines do not have Element.replaceChildren.
 * These tests remove it from jsdom to make sure the theme samples do not
 * need it. */
describe("GobanThemePicker theme samples without Element.replaceChildren", () => {
    let desc: PropertyDescriptor | undefined;
    let errors: unknown[] = [];
    let saved_stone_scale: number;
    const onError = (ev: ErrorEvent) => {
        errors.push(ev.error);
        ev.preventDefault();
    };

    beforeEach(() => {
        errors = [];
        image_data_calls.length = 0;
        saved_stone_scale = preferences.get("goban-theme-stone-scale");
        data.set("user", { anonymous: true, id: 0 } as rest_api.UserConfig);
        data.remove("experiments.svg");
        data.remove("experiments.canvas");
        jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => fakeContext);

        desc = Object.getOwnPropertyDescriptor(Element.prototype, "replaceChildren");
        expect(desc).toBeDefined();
        delete (Element.prototype as Partial<Element>).replaceChildren;

        window.addEventListener("error", onError);
    });

    afterEach(() => {
        if (desc) {
            Object.defineProperty(Element.prototype, "replaceChildren", desc);
        }
        window.removeEventListener("error", onError);
        jest.restoreAllMocks();
        preferences.set("goban-theme-stone-scale", saved_stone_scale);
    });

    test.each([
        ["black", GobanBlackThemePicker],
        ["white", GobanWhiteThemePicker],
    ] as const)("the %s picker mounts and shows every standard theme", async (color, Picker) => {
        const { container } = render(<Picker size={32} />);
        await flushEffects();

        expect(errors).toEqual([]);

        const expected = Goban.THEMES_SORTED[color].filter((t) => t.theme_name !== "Custom").length;
        expect(expected).toBeGreaterThan(0);

        const selectors = hostsWithSvg(container);
        expect(selectors.length).toBe(expected);
        for (const selector of selectors) {
            const svgs = selector.querySelectorAll("svg");
            expect(svgs.length).toBe(1);
            expect(svgs[0].getAttribute("width")).toBe("32");
            expect(svgs[0].getAttribute("height")).toBe("32");
        }

        if (color === "black") {
            expect(image_data_calls.length).toBeGreaterThan(0);
        }
        const bad_calls = image_data_calls.filter(
            ({ w, h }) => !(Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0),
        );
        expect(bad_calls).toEqual([]);
    });

    test("a preference update clears stale host content and replaces the svg", async () => {
        const { container } = render(<GobanBlackThemePicker size={32} />);
        await flushEffects();

        const selectors_before = hostsWithSvg(container);
        expect(selectors_before.length).toBeGreaterThan(0);

        const old_svg = selectors_before[0].querySelector("svg") as SVGSVGElement;
        const host = old_svg.parentElement as HTMLElement;
        const stale = document.createElement("span");
        host.appendChild(stale);

        await act(async () => {
            preferences.set("goban-theme-stone-scale", 0.9);
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(errors).toEqual([]);
        expect(stale.isConnected).toBe(false);
        expect(old_svg.isConnected).toBe(false);
        expect(host.childNodes.length).toBe(1);
        expect(host.firstChild).toBeInstanceOf(SVGSVGElement);
        expect(host.firstChild).not.toBe(old_svg);

        for (const selector of selectors_before) {
            expect(selector.querySelectorAll("svg").length).toBe(1);
        }
    });

    test("the custom picker shows the marker", async () => {
        const { container } = render(<GobanCustomBlackPicker size={32} />);
        await flushEffects();

        expect(errors).toEqual([]);

        const selector = container.querySelector(".select-custom .selector") as HTMLElement;
        expect(selector).not.toBeNull();
        const svgs = selector.querySelectorAll("svg");
        expect(svgs.length).toBe(1);
        const texts = Array.from(svgs[0].querySelectorAll("text"));
        expect(texts.some((t) => t.textContent === "A")).toBe(true);
    });

    test("unmount removes the svg from the host", async () => {
        const { container, unmount } = render(<GobanBlackThemePicker size={32} />);
        await flushEffects();

        const svg = container.querySelector(".selector svg") as SVGSVGElement;
        expect(svg).not.toBeNull();
        const host = svg.parentElement as HTMLElement;

        unmount();

        expect(host.querySelectorAll(":scope > svg").length).toBe(0);
        expect(errors).toEqual([]);
    });
});
