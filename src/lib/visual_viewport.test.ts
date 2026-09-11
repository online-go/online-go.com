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

import { visual_viewport_insets } from "./visual_viewport";

describe("visual_viewport_insets", () => {
    test("reports no insets when the visual viewport covers the layout viewport", () => {
        /* Desktop, and Chrome/Android with interactive-widget=resizes-content:
         * the keyboard shrinks the layout viewport itself, so the two match. */
        expect(visual_viewport_insets(508, 0, 508, 1)).toEqual({ top: 0, bottom: 0, height: 508 });
    });

    test("reports the pan as a top inset when Safari scrolls to the focused input", () => {
        /* Measured on iOS Safari: the layout viewport stays 714pt tall, the
         * keyboard leaves 377pt visible and Safari pans all the way down. */
        expect(visual_viewport_insets(714, 337, 377, 1)).toEqual({
            top: 337,
            bottom: 0,
            height: 377,
        });
    });

    test("reports the keyboard as a bottom inset when the page is not panned", () => {
        expect(visual_viewport_insets(714, 0, 377, 1)).toEqual({
            top: 0,
            bottom: 337,
            height: 377,
        });
    });

    test("splits a partial pan between the two insets", () => {
        expect(visual_viewport_insets(714, 100, 377, 1)).toEqual({
            top: 100,
            bottom: 237,
            height: 377,
        });
    });

    test("ignores pinch zoom", () => {
        /* Zoomed in, the visual viewport is a small window onto the page.
         * Following it would make the chat chase the zoom, so treat it as
         * covering the layout viewport. */
        expect(visual_viewport_insets(714, 200, 300, 2.5)).toEqual({
            top: 0,
            bottom: 0,
            height: 714,
        });
    });

    test("tolerates the tiny scale drift browsers report", () => {
        expect(visual_viewport_insets(714, 337, 377, 1.0000001)).toEqual({
            top: 337,
            bottom: 0,
            height: 377,
        });
    });

    test("clamps subpixel overshoot to zero", () => {
        expect(visual_viewport_insets(714, 337.4, 377, 1)).toEqual({
            top: 337,
            bottom: 0,
            height: 377,
        });
    });

    test("does not let overscroll inflate the bottom inset", () => {
        /* Safari reports a negative offset while the page rubber-bands past
         * its top edge. The keyboard is still 337pt tall, so the bottom
         * inset must not grow with the overscroll. */
        expect(visual_viewport_insets(714, -20, 377, 1)).toEqual({
            top: 0,
            bottom: 337,
            height: 377,
        });
    });

    test("survives unmeasurable metrics", () => {
        expect(visual_viewport_insets(714, NaN, NaN, NaN)).toEqual({
            top: 0,
            bottom: 0,
            height: 714,
        });
    });
});
