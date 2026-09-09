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
import {
    clampPortraitStage,
    portraitAvailableHeightPx,
    portraitStageBoundsPx,
    portraitStageExtraHeightPx,
    remToPx,
} from "./resizerUtil";

const KEYBOARD_STEP_REM = 1;
const KEYBOARD_LARGE_STEP_REM = 5;

interface PortraitSplitterProps {
    /** The GobanView root, used to bound the stage to the column height
     *  before the column can be measured. */
    rootRef: React.RefObject<HTMLDivElement | null>;
    /** The board stage, measured when a drag or key press starts. */
    stageRef: React.RefObject<HTMLDivElement | null>;
    /** The panel area below the handle. It and the stage share the space the
     *  handle divides, so the two together measure how much there is. */
    panelsRef: React.RefObject<HTMLDivElement | null>;
    /** Called on every pointer move while dragging with the clamped height. */
    onPreview: (height: number) => void;
    /** Called when the drag ends or a key changes the height. Null resets the
     *  stage to its automatic height. */
    onCommit: (height: number | null) => void;
    /** Called instead of `onCommit` when a drag ends on the height it started
     *  at. The stored height must not change, but the preview from `onPreview`
     *  has to be dropped: it is what holds the stage's inline height and the
     *  view's resize cursor. */
    onCancel: () => void;
}

/**
 * The drag handle between the board and the panels in the portrait split.
 * Dragging it down grows the board. Double-tap, Enter or Escape reset it to
 * the automatic height; the up and down arrows nudge it.
 */
export function PortraitSplitter({
    rootRef,
    stageRef,
    panelsRef,
    onPreview,
    onCommit,
    onCancel,
}: PortraitSplitterProps): React.ReactElement {
    const [is_dragging, setIsDragging] = React.useState(false);
    const drag_ref = React.useRef<{
        pointer_id: number;
        start_y: number;
        start_height: number;
        height: number;
    } | null>(null);

    const availableHeight = React.useCallback(
        () => portraitAvailableHeightPx(stageRef.current, panelsRef.current, rootRef.current),
        [rootRef, stageRef, panelsRef],
    );

    const stageExtraHeight = React.useCallback(
        () => portraitStageExtraHeightPx(stageRef.current),
        [stageRef],
    );

    const clampHeight = React.useCallback(
        (height: number) => clampPortraitStage(height, availableHeight(), stageExtraHeight()),
        [availableHeight, stageExtraHeight],
    );

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !stageRef.current) {
            return;
        }
        event.preventDefault();
        const start_height = stageRef.current.offsetHeight;
        drag_ref.current = {
            pointer_id: event.pointerId,
            start_y: event.clientY,
            start_height,
            height: start_height,
        };
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setIsDragging(true);
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = drag_ref.current;
        if (!drag || drag.pointer_id !== event.pointerId) {
            return;
        }
        drag.height = clampHeight(drag.start_height + (event.clientY - drag.start_y));
        onPreview(drag.height);
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
        // A tap that never moved, a drag that came back to where it started
        // and a drag against a clamp limit must all leave an automatic split
        // automatic; committing the height it happened to have would pin it.
        // Cancelling still ends the drag, which is what drops the preview.
        if (drag.height === drag.start_height) {
            onCancel();
            return;
        }
        onCommit(drag.height);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const current_height = stageRef.current?.offsetHeight;
        if (current_height === undefined) {
            return;
        }
        const step = remToPx(event.shiftKey ? KEYBOARD_LARGE_STEP_REM : KEYBOARD_STEP_REM);
        let next: number | null | undefined;
        switch (event.key) {
            case "ArrowUp":
                next = clampHeight(current_height - step);
                break;
            case "ArrowDown":
                next = clampHeight(current_height + step);
                break;
            case "Enter":
            case "Escape":
                next = null;
                break;
            default:
                return;
        }
        // Kibitz binds the arrow keys to move navigation; keep those
        // shortcuts from firing while the handle has focus.
        event.preventDefault();
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
        onCommit(next);
    };

    const bounds = portraitStageBoundsPx(availableHeight(), stageExtraHeight());

    return (
        <div
            className={"GobanView-portrait-splitter" + (is_dragging ? " is-dragging" : "")}
            role="separator"
            aria-orientation="horizontal"
            aria-label={pgettext(
                "Accessible name of the handle that resizes the board and the panels below it",
                "Resize board",
            )}
            aria-valuenow={stageRef.current?.offsetHeight}
            aria-valuemin={bounds.min}
            aria-valuemax={bounds.max}
            title={pgettext(
                "Tooltip on the handle that resizes the board and the panels below it",
                "Drag to resize, double-tap to reset",
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
