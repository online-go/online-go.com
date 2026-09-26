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

const REFERENCE_BOARD = 9;
/** Historical horizontal inset: min(body width - 50, 20em). */
const SIDE_PADDING = 50;
/**
 * Used when the lesson container cannot be measured.
 * Navbar plus LearningPage's padding-top is a bit over 7rem.
 */
export const FALLBACK_VERTICAL_CHROME = 160;
/** Keep a couple of pixels so the row does not wrap on a rounding error. */
const COLUMN_SLACK = 8;
/**
 * .LearningHub-section-nav is 17rem with 2rem of horizontal margin on each side.
 * .LearningPage-pages is 15rem with a 1rem left margin.
 * Below 40rem those columns become full width and wrap, so they are not reserved.
 */
const DESKTOP_COLUMNS_REM = 17 + 2 + 2 + 15 + 1;
const STACKED_LAYOUT_REM = 40;

export interface LessonBoardGeometry {
    width?: number;
    height?: number;
    bounds?: { top: number; left: number; bottom: number; right: number };
}

export interface InstructionalGobanSizeInput {
    visibleSpan: number;
    /** Caller-supplied pixel width. Wins outright when positive. */
    explicitDisplayWidth?: number;
    /** Measured width of the #em10 element (10em). */
    em10Width: number;
    viewportWidth: number;
    viewportHeight: number;
    /** Pixels of the viewport already used by the navbar and lesson padding. */
    verticalChrome: number;
    /** documentElement font size. CSS rem columns are based on this, not on #em10. */
    rootFontSize: number;
    /**
     * Measured pixels left beside the section list and the lesson text.
     * Omit when those columns are stacked or could not be measured.
     */
    measuredBesideColumns?: number;
}

/**
 * Intersections actually drawn. Goban sizes the canvas from the bounds
 * (right - left + 1), not from the nominal board width. A 19x19 lesson
 * cropped to a 9x9 corner therefore has to stay the same pixel size as a 9x9.
 */
export function visibleIntersectionSpan(config?: LessonBoardGeometry): number {
    const width = config?.width && config.width > 0 ? config.width : REFERENCE_BOARD;
    const height = config?.height && config.height > 0 ? config.height : REFERENCE_BOARD;
    const bounds = config?.bounds;
    if (bounds) {
        const boundedWidth = bounds.right - bounds.left + 1;
        const boundedHeight = bounds.bottom - bounds.top + 1;
        if (boundedWidth > 0 && boundedHeight > 0) {
            return Math.max(boundedWidth, boundedHeight);
        }
    }
    return Math.max(width, height);
}

/**
 * Pixel width passed to goban as display_width.
 *
 * A view of 9 intersections or fewer keeps the historical size, so the
 * existing lessons do not move. A wider view scales from that size, which
 * keeps the stones about as big as on a 9x9, then stops at the viewport so
 * the section list and the lesson text can stay on the same row.
 */
export function instructionalGobanDisplayWidth(input: InstructionalGobanSizeInput): number {
    if (input.explicitDisplayWidth && input.explicitDisplayWidth > 0) {
        return input.explicitDisplayWidth;
    }

    const span = Math.max(input.visibleSpan || REFERENCE_BOARD, 1);
    const historicalWidthRoom = Math.max(input.viewportWidth - SIDE_PADDING, 0);
    const nineSize = Math.min(historicalWidthRoom, Math.max(input.em10Width, 0) * 2);

    if (span <= REFERENCE_BOARD) {
        return nineSize;
    }

    const scaled = nineSize * (span / REFERENCE_BOARD);
    const heightRoom = Math.max(input.viewportHeight - input.verticalChrome, nineSize);
    const fitted = Math.min(scaled, widthRoomFor(input), heightRoom);
    // Never draw a large board smaller than the old fixed size.
    return Math.max(fitted, nineSize);
}

function widthRoomFor(input: InstructionalGobanSizeInput): number {
    const root = input.rootFontSize > 0 ? input.rootFontSize : 16;
    let beside: number;
    if (input.measuredBesideColumns && input.measuredBesideColumns > 0) {
        beside = input.measuredBesideColumns;
    } else if (input.viewportWidth <= STACKED_LAYOUT_REM * root) {
        beside = input.viewportWidth - SIDE_PADDING;
    } else {
        beside = input.viewportWidth - DESKTOP_COLUMNS_REM * root;
    }
    return Math.max(beside - COLUMN_SLACK, 0);
}
