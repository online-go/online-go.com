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

/*
 * Mobile browsers do not agree on what the on-screen keyboard does to the
 * page. Chrome on Android honours `interactive-widget=resizes-content` in the
 * viewport meta tag and shrinks the layout viewport, so `position: fixed;
 * bottom: 0` lands above the keyboard on its own. Safari on iOS ignores that
 * key: the layout viewport keeps its full height, only the visual viewport
 * shrinks, and Safari pans the visual viewport down to show the focused
 * input. Anything fixed to the top of the layout viewport pans out of view,
 * and anything fixed to its bottom sits behind the keyboard until the pan
 * brings it back.
 *
 * This module publishes the visual viewport's position within the layout
 * viewport as CSS variables so that a fixed element can pin itself to the
 * visible region instead:
 *
 *   --visual-viewport-top     distance from the top of the layout viewport
 *                             to the top of the visual viewport
 *   --visual-viewport-bottom  distance from the bottom of the visual viewport
 *                             to the bottom of the layout viewport
 *   --visual-viewport-height  height of the visual viewport
 *
 * Both insets are 0 wherever the two viewports coincide, so layouts that use
 * them behave exactly as before on desktop and on browsers that resize the
 * layout viewport.
 */

/** Scale drift below this is treated as "not zoomed". */
const SCALE_TOLERANCE = 0.01;

export interface VisualViewportInsets {
    top: number;
    bottom: number;
    height: number;
}

/**
 * Where the visual viewport sits inside the layout viewport, in CSS pixels.
 *
 * Pinch zoom also shrinks the visual viewport, but following it there would
 * make pinned elements chase the zoom around the page, so a zoomed viewport
 * is reported as covering the whole layout viewport. Unmeasurable inputs are
 * treated the same way, so a browser without the API loses nothing.
 */
export function visual_viewport_insets(
    layout_height: number,
    offset_top: number,
    height: number,
    scale: number,
): VisualViewportInsets {
    const measurable = isFinite(offset_top) && isFinite(height) && isFinite(scale);
    const zoomed = Math.abs(scale - 1) > SCALE_TOLERANCE;

    if (!measurable || zoomed) {
        return { top: 0, bottom: 0, height: layout_height };
    }

    const top = Math.max(0, Math.round(offset_top));
    const bottom = Math.max(0, Math.round(layout_height - offset_top - height));
    return { top, bottom, height: Math.round(height) };
}

export function update_visual_viewport_variables(): void {
    const vv = window.visualViewport;
    if (!vv) {
        return;
    }

    const insets = visual_viewport_insets(
        document.documentElement.clientHeight,
        vv.offsetTop,
        vv.height,
        vv.scale,
    );

    const style = document.documentElement.style;
    style.setProperty("--visual-viewport-top", `${insets.top}px`);
    style.setProperty("--visual-viewport-bottom", `${insets.bottom}px`);
    style.setProperty("--visual-viewport-height", `${insets.height}px`);
}

export function init_visual_viewport_variables(): void {
    const vv = window.visualViewport;
    if (!vv) {
        return;
    }

    let scheduled = false;
    const schedule = () => {
        if (scheduled) {
            return;
        }
        scheduled = true;
        window.requestAnimationFrame(() => {
            scheduled = false;
            update_visual_viewport_variables();
        });
    };

    update_visual_viewport_variables();
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
}
