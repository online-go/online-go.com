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
import { MIN_BOARD_PANE_REM, remToPx } from "./resizerUtil";

const KEYBOARD_STEP_REM = 1;
const KEYBOARD_LARGE_STEP_REM = 5;

interface SidebarResizerProps {
    /** The GobanView root, used to bound the width so the board pane keeps
     *  its minimum width. */
    rootRef: React.RefObject<HTMLDivElement | null>;
    /** The element this handle resizes, measured when a drag or key press
     *  starts. */
    targetRef: React.RefObject<HTMLDivElement | null>;
    /** "start": the handle is on the target's left edge (the main sidebar);
     *  dragging left widens it. "end": the handle is on its right edge
     *  (the left aside); dragging right widens it. */
    edge: "start" | "end";
    /** CSS variable holding the target's minimum width, e.g.
     *  "--goban-view-sidebar-width". */
    minWidthVar: string;
    /** Accessible name of the handle. */
    label: string;
    /** Called on every pointer move while dragging with the clamped width. */
    onPreview: (width: number) => void;
    /** Called when the drag ends or a key changes the width. Null resets the
     *  target to its automatic width. */
    onCommit: (width: number | null) => void;
}

/** The smallest width the user can drag the target to: the fixed width the
 *  target had before it became resizable, read from the given CSS variable
 *  so the two never drift apart. */
function minWidthPx(root: HTMLElement | null, varName: string): number {
    const value = root ? getComputedStyle(root).getPropertyValue(varName) : "";
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 400;
    }
    return value.trim().endsWith("rem") ? remToPx(parsed) : parsed;
}

/** The range a resizable column can be set to, in pixels. The maximum keeps
 *  the board pane at least its minimum width: the board pane and the target
 *  share exactly their combined measured width, since the target only grows
 *  by what the board pane gives up. Before layout has run, it reserves the
 *  other columns' widths out of the view instead. */
export function resizableWidthBoundsPx(
    root: HTMLElement | null,
    target: HTMLElement | null,
    minWidthVar: string,
): { min: number; max: number } {
    const min = minWidthPx(root, minWidthVar);
    const center_width = root?.querySelector<HTMLElement>(".GobanView-center")?.offsetWidth ?? 0;
    const target_width = target?.offsetWidth ?? 0;
    const shared_width = center_width + target_width;
    let max: number;
    if (shared_width > 0 && center_width > 0) {
        max = shared_width - remToPx(MIN_BOARD_PANE_REM);
    } else {
        const view_width = root?.offsetWidth ?? window.innerWidth;
        const others = Array.from(
            root?.querySelectorAll<HTMLElement>(
                ".GobanView-left-aside, .GobanView-sidebar, .GobanView-action-dock",
            ) ?? [],
        )
            .filter((el) => el !== target)
            .reduce((sum, el) => sum + el.offsetWidth, 0);
        max = view_width - others - remToPx(MIN_BOARD_PANE_REM);
    }
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
 * The drag handle beside a resizable GobanView column: the landscape
 * sidebar (edge "start") or the left aside (edge "end"). Dragging widens
 * the target toward its edge. Double-click, Enter or Escape reset the
 * target to its automatic width; the arrow keys nudge it.
 */
export function SidebarResizer({
    rootRef,
    targetRef,
    edge,
    minWidthVar,
    label,
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
            const { min, max } = resizableWidthBoundsPx(
                rootRef.current,
                targetRef.current,
                minWidthVar,
            );
            return Math.round(Math.min(max, Math.max(min, width)));
        },
        [rootRef, targetRef, minWidthVar],
    );

    // The target width is CSS-driven when no custom width is set, so the
    // values reported to assistive technology are measured from the DOM and
    // kept current as the target or the view changes size. This is a passive
    // effect because the target is rendered after the resizer, so its ref is
    // not attached yet when layout effects run.
    const [width_values, setWidthValues] = React.useState<SidebarWidthValues | null>(null);
    React.useEffect(() => {
        const measure = () => {
            const target = targetRef.current;
            if (!target) {
                return;
            }
            const next = {
                now: Math.round(target.offsetWidth),
                ...resizableWidthBoundsPx(rootRef.current, target, minWidthVar),
            };
            setWidthValues((prev) => (sameValues(prev, next) ? prev : next));
        };
        measure();
        if (typeof window.ResizeObserver !== "function") {
            window.addEventListener("resize", measure);
            return () => window.removeEventListener("resize", measure);
        }
        const observer = new ResizeObserver(measure);
        if (targetRef.current) {
            observer.observe(targetRef.current);
        }
        if (rootRef.current) {
            observer.observe(rootRef.current);
        }
        return () => observer.disconnect();
    }, [rootRef, targetRef, minWidthVar]);

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !targetRef.current) {
            return;
        }
        event.preventDefault();
        const start_width = targetRef.current.offsetWidth;
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
        const delta =
            edge === "start" ? drag.start_x - event.clientX : event.clientX - drag.start_x;
        drag.width = clampWidth(drag.start_width + delta);
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
        const current_width = targetRef.current?.offsetWidth;
        if (current_width === undefined) {
            return;
        }
        const step = remToPx(event.shiftKey ? KEYBOARD_LARGE_STEP_REM : KEYBOARD_STEP_REM);
        const grow = edge === "start" ? "ArrowLeft" : "ArrowRight";
        const shrink = edge === "start" ? "ArrowRight" : "ArrowLeft";
        let next: number | null | undefined;
        switch (event.key) {
            case grow:
                next = clampWidth(current_width + step);
                break;
            case shrink:
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
