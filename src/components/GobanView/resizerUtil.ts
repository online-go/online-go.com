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

/** Convert a rem measurement to pixels using the document's root font size. */
export function remToPx(rem: number): number {
    const root_font_size = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return rem * root_font_size;
}

/** The smallest the board itself may become in the portrait split. Matches the
 *  portrait board's CSS min-height so the two never drift apart. The stage
 *  holds more than the board, so this is not the stage's floor: see
 *  `portraitStageExtraHeightPx`. */
export const MIN_PORTRAIT_BOARD_REM = 8;

/** The panel area's share of the portrait split. The handle never takes the
 *  panels below it, and the CSS starts them from it, but the automatic layout
 *  treats it as a soft default: a board too tall for the column still squeezes
 *  the panels below this. */
export const MIN_PORTRAIT_PANEL_REM = 8;

/** The height the board stage and the panel area share in the portrait split.
 *  Those two are the only parts of the column that flex, so their combined
 *  height is exactly the space there is to divide between them, with the
 *  header, the handle, the slider and the tab bar already excluded by
 *  measuring rather than modelling.
 *
 *  Either can measure zero: before layout has run, or when a stage that was
 *  dragged to the top of its range has taken every pixel the panels had. The
 *  sum is therefore only trusted while both are above zero. Otherwise the
 *  column the two live in is measured instead, less everything in it that is
 *  neither of them — the drag handle, today. Reporting the whole view here
 *  instead would overstate the shared space by the header, the handle, the
 *  slider and the tab bar, and a maximum computed from that would keep
 *  giving the stage the height that emptied the panels in the first place.
 *  The view stays the last resort, for a stage that is not laid out yet. */
export function portraitAvailableHeightPx(
    stage: HTMLElement | null,
    panels: HTMLElement | null,
    root: HTMLElement | null,
): number {
    const stage_height = stage?.offsetHeight ?? 0;
    const panels_height = panels?.offsetHeight ?? 0;
    if (stage_height > 0 && panels_height > 0) {
        return stage_height + panels_height;
    }

    const column = stage?.parentElement ?? panels?.parentElement ?? null;
    if (column && column.clientHeight > 0) {
        let shared = column.clientHeight;
        for (const child of Array.from(column.children)) {
            if (child !== stage && child !== panels) {
                shared -= (child as HTMLElement).offsetHeight;
            }
        }
        return Math.max(0, shared);
    }

    return root?.clientHeight ?? window.innerHeight;
}

/** The height the stage needs on top of the board: the player bars and the
 *  `aboveBoard` and `belowBoard` slots a consumer puts in it. None of them
 *  shrink, and the split stage clips what does not fit, so the stage's floor
 *  is the board's minimum plus this. It is measured rather than modelled, so
 *  it stays right for a consumer that adds a slot or renders no bars at all. */
export function portraitStageExtraHeightPx(stage: HTMLElement | null): number {
    if (!stage) {
        return 0;
    }
    let extra = 0;
    for (const child of Array.from(stage.children)) {
        if (!child.classList.contains("GobanView-center")) {
            extra += (child as HTMLElement).offsetHeight;
        }
    }
    return extra;
}

/** The range the portrait board stage height can be set to, in pixels.
 *  `stage_extra_height` is what the stage holds besides the board, from
 *  `portraitStageExtraHeightPx`. The minimum keeps all of it on screen along
 *  with a board of at least `MIN_PORTRAIT_BOARD_REM`; the maximum keeps the
 *  panel area at least `MIN_PORTRAIT_PANEL_REM`. A viewport too short for both
 *  reports a maximum equal to the minimum rather than an empty range. */
export function portraitStageBoundsPx(
    available_height: number,
    stage_extra_height: number = 0,
): {
    min: number;
    max: number;
} {
    const min = Math.round(remToPx(MIN_PORTRAIT_BOARD_REM) + stage_extra_height);
    const max = Math.max(min, Math.round(available_height - remToPx(MIN_PORTRAIT_PANEL_REM)));
    return { min, max };
}

/** Clamp a stored stage height into the range this viewport allows. Stored
 *  heights travel between devices, so a value from a taller screen must not
 *  leave the board or the panels with no room. */
export function clampPortraitStage(
    height: number,
    available_height: number,
    stage_extra_height: number = 0,
): number {
    const { min, max } = portraitStageBoundsPx(available_height, stage_extra_height);
    return Math.round(Math.min(max, Math.max(min, height)));
}
