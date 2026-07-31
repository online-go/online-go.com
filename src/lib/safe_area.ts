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
 * `env(safe-area-inset-bottom)` is supposed to describe a region *inside* the
 * viewport that system UI draws over, so layouts pad by it to keep controls
 * reachable. On iOS that holds: the page really does extend under the home
 * indicator.
 *
 * Chrome on Android reports a bottom inset equal to the gesture navigation
 * bar even when the viewport already stops above it -- `window.innerHeight`,
 * `100dvh` and `position: fixed; bottom: 0` all land above the nav bar.
 * Padding by the inset there reserves the same strip a second time and leaves
 * a dead band along the bottom of the screen.
 *
 * There is no way to observe the occlusion directly, so we compare the
 * reported inset against the gap between the bottom of the viewport and the
 * bottom of the screen. When those match, the strip is demonstrably already
 * outside the viewport and the inset is redundant. Anything else -- including
 * every case we cannot measure confidently -- keeps the reported inset, so a
 * browser that needs the padding never loses it.
 */

/** Largest difference, in CSS pixels, we still treat as "the same strip".
 *  Covers subpixel rounding of the screen and viewport metrics. */
const MATCH_TOLERANCE = 4;

function measure_reported_inset(): number {
    const probe = document.createElement("div");
    probe.style.cssText =
        "position:absolute;top:0;left:0;width:0;visibility:hidden;pointer-events:none;" +
        "height:env(safe-area-inset-bottom)";
    document.body.appendChild(probe);
    const inset = probe.getBoundingClientRect().height;
    probe.remove();
    return inset;
}

/** Space between the bottom of the viewport and the bottom of the screen. */
function measure_gap_below_viewport(): number {
    return window.screen.height - (window.screenY + window.innerHeight);
}

/**
 * How much bottom inset to actually reserve, given what the browser reports
 * and how much room is left between the viewport and the edge of the screen.
 *
 * Returns 0 only when the gap matches the reported inset closely enough that
 * the strip is provably outside the viewport already. Every other case,
 * including unmeasurable ones, returns the reported inset unchanged.
 */
export function effective_bottom_inset(reported_inset: number, gap_below_viewport: number): number {
    if (!(reported_inset > 0) || !isFinite(gap_below_viewport)) {
        return Math.max(0, reported_inset);
    }
    const already_reserved = Math.abs(gap_below_viewport - reported_inset) <= MATCH_TOLERANCE;
    return already_reserved ? 0 : reported_inset;
}

export function update_safe_area_variables(): void {
    const effective = effective_bottom_inset(
        measure_reported_inset(),
        measure_gap_below_viewport(),
    );

    document.documentElement.style.setProperty("--safe-area-inset-bottom", `${effective}px`);
}

export function init_safe_area_variables(): void {
    update_safe_area_variables();
    window.addEventListener("resize", update_safe_area_variables);
    window.addEventListener("orientationchange", update_safe_area_variables);
}
