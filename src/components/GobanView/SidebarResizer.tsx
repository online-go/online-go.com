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

/** Largest width the user can drag the sidebar to, as a fraction of the view. */
const MAX_SIDEBAR_WIDTH_FRACTION = 0.75;
const KEYBOARD_STEP_REM = 1;
const KEYBOARD_LARGE_STEP_REM = 5;

interface SidebarResizerProps {
    /** The GobanView root, used to bound the width to a fraction of the view. */
    rootRef: React.RefObject<HTMLDivElement | null>;
    /** The sidebar element, measured when a drag or key press starts. */
    sidebarRef: React.RefObject<HTMLDivElement | null>;
    /** Called on every pointer move while dragging with the clamped width. */
    onPreview: (width: number) => void;
    /** Called when the drag ends or a key changes the width. Null resets the
     *  sidebar to its automatic width. */
    onCommit: (width: number | null) => void;
}

function remToPx(rem: number): number {
    const root_font_size = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return rem * root_font_size;
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
            const view_width = rootRef.current?.offsetWidth ?? window.innerWidth;
            const min = minSidebarWidthPx(rootRef.current);
            const max = Math.max(min, view_width * MAX_SIDEBAR_WIDTH_FRACTION);
            return Math.round(Math.min(max, Math.max(min, width)));
        },
        [rootRef],
    );

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
