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
import { pgettext } from "@/lib/translate";
import { remToPx } from "./resizerUtil";

/** The narrowest the board pane may become. Below this a 19x19 board stops
 *  being legible, so the sidebar is not allowed to take the width. */
const MIN_BOARD_PANE_REM = 24;
const KEYBOARD_STEP_REM = 1;
const KEYBOARD_LARGE_STEP_REM = 5;

interface SidebarResizerProps {
    /** The GobanView root, used to bound the width so the board pane keeps
     *  its minimum width. */
    rootRef: React.RefObject<HTMLDivElement | null>;
    /** The sidebar element, measured when a drag or key press starts. */
    sidebarRef: React.RefObject<HTMLDivElement | null>;
    /** Called on every pointer move while dragging with the clamped width. */
    onPreview: (width: number) => void;
    /** Called when the drag ends or a key changes the width. Null resets the
     *  sidebar to its automatic width. */
    onCommit: (width: number | null) => void;
}

/** The smallest width the user can drag the sidebar to: the fixed width the
 *  sidebar had before it became resizable, read from the CSS variable so the
 *  two never drift apart. */
function minSidebarWidthPx(root: HTMLElement | null): number {
    const value = root ? getComputedStyle(root).getPropertyValue("--goban-view-sidebar-width") : "";
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 400;
    }
    return value.trim().endsWith("rem") ? remToPx(parsed) : parsed;
}

/** Maximum sidebar width before layout has run, when the board pane and
 *  sidebar cannot yet be measured: reserves the left aside's measured width
 *  (zero if there is none) out of the view instead. */
function fallbackMaxSidebarWidthPx(root: HTMLElement | null): number {
    const view_width = root?.offsetWidth ?? window.innerWidth;
    const aside_width = root?.querySelector<HTMLElement>(".GobanView-left-aside")?.offsetWidth ?? 0;
    return view_width - aside_width - remToPx(MIN_BOARD_PANE_REM);
}

/** The range the sidebar width can be set to, in pixels. The maximum always
 *  keeps the board pane at least its minimum width: the board pane and the
 *  sidebar's combined current width is exactly the space the two share,
 *  with every fixed margin and gap around them already excluded by measuring
 *  rather than modelling, and that sum stays constant while dragging, since
 *  the sidebar only ever grows by what the board pane gives up. Before
 *  layout has run either can measure zero, so it falls back to reserving
 *  the left aside's width out of the view instead. */
export function sidebarWidthBoundsPx(root: HTMLElement | null): { min: number; max: number } {
    const min = minSidebarWidthPx(root);
    const center_width = root?.querySelector<HTMLElement>(".GobanView-center")?.offsetWidth ?? 0;
    const sidebar_width = root?.querySelector<HTMLElement>(".GobanView-sidebar")?.offsetWidth ?? 0;
    const shared_width = center_width + sidebar_width;
    const max =
        shared_width > 0
            ? shared_width - remToPx(MIN_BOARD_PANE_REM)
            : fallbackMaxSidebarWidthPx(root);
    return { min: Math.round(min), max: Math.round(Math.max(min, max)) };
}

interface SidebarWidthValues {
    now: number;
    min: number;
    max: number;
}

function sameValues(a: SidebarWidthValues | null, b: SidebarWidthValues): boolean {
    return a !== null && a.now === b.now && a.min === b.min && a.max === b.max;
}

/**
 * The drag handle in the gap between the goban and the landscape sidebar.
 * Dragging it left widens the sidebar. Double-click, Enter or Escape reset
 * the sidebar to its automatic width; the arrow keys nudge it.
 */
export function SidebarResizer({
    rootRef,
    sidebarRef,
    onPreview,
    onCommit,
}: SidebarResizerProps): React.ReactElement {
    const [is_dragging, setIsDragging] = React.useState(false);
    const drag_ref = React.useRef<{
        pointer_id: number;
        start_x: number;
        start_width: number;
        width: number;
    } | null>(null);

    const clampWidth = React.useCallback(
        (width: number): number => {
            const { min, max } = sidebarWidthBoundsPx(rootRef.current);
            return Math.round(Math.min(max, Math.max(min, width)));
        },
        [rootRef],
    );

    // The sidebar width is CSS-driven when no custom width is set, so the
    // values reported to assistive technology are measured from the DOM and
    // kept current as the sidebar or the view changes size. This is a passive
    // effect because the sidebar is rendered after the resizer, so its ref is
    // not attached yet when layout effects run.
    const [width_values, setWidthValues] = React.useState<SidebarWidthValues | null>(null);
    React.useEffect(() => {
        const measure = () => {
            const sidebar = sidebarRef.current;
            if (!sidebar) {
                return;
            }
            const next = {
                now: Math.round(sidebar.offsetWidth),
                ...sidebarWidthBoundsPx(rootRef.current),
            };
            setWidthValues((prev) => (sameValues(prev, next) ? prev : next));
        };
        measure();
        if (typeof window.ResizeObserver !== "function") {
            window.addEventListener("resize", measure);
            return () => window.removeEventListener("resize", measure);
        }
        const observer = new ResizeObserver(measure);
        if (sidebarRef.current) {
            observer.observe(sidebarRef.current);
        }
        if (rootRef.current) {
            observer.observe(rootRef.current);
        }
        return () => observer.disconnect();
    }, [rootRef, sidebarRef]);

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !sidebarRef.current) {
            return;
        }
        event.preventDefault();
        const start_width = sidebarRef.current.offsetWidth;
        drag_ref.current = {
            pointer_id: event.pointerId,
            start_x: event.clientX,
            start_width,
            width: start_width,
        };
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setIsDragging(true);
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = drag_ref.current;
        if (!drag || drag.pointer_id !== event.pointerId) {
            return;
        }
        drag.width = clampWidth(drag.start_width + (drag.start_x - event.clientX));
        onPreview(drag.width);
    };

    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = drag_ref.current;
        if (!drag || drag.pointer_id !== event.pointerId) {
            return;
        }
        drag_ref.current = null;
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        setIsDragging(false);
        onCommit(drag.width);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const current_width = sidebarRef.current?.offsetWidth;
        if (current_width === undefined) {
            return;
        }
        const step = remToPx(event.shiftKey ? KEYBOARD_LARGE_STEP_REM : KEYBOARD_STEP_REM);
        let next: number | null | undefined;
        switch (event.key) {
            case "ArrowLeft":
                next = clampWidth(current_width + step);
                break;
            case "ArrowRight":
                next = clampWidth(current_width - step);
                break;
            case "Enter":
            case "Escape":
                next = null;
                break;
            default:
                return;
        }
        // The game view binds the arrow keys to move navigation; keep those
        // shortcuts from firing while the handle has focus.
        event.preventDefault();
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
        onCommit(next);
    };

    const label = pgettext(
        "Accessible name of the handle that resizes the panel next to the board",
        "Resize sidebar",
    );

    return (
        <div
            className={"GobanView-sidebar-resizer" + (is_dragging ? " is-dragging" : "")}
            role="separator"
            aria-orientation="vertical"
            aria-label={label}
            aria-valuenow={width_values?.now}
            aria-valuemin={width_values?.min}
            aria-valuemax={width_values?.max}
            title={pgettext(
                "Tooltip on the handle that resizes the panel next to the board",
                "Drag to resize, double-click to reset",
            )}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onDoubleClick={() => onCommit(null)}
            onKeyDown={onKeyDown}
        />
    );
}
