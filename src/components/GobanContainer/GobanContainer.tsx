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
import { PersistentElement } from "PersistentElement";
import { OgsResizeDetector } from "OgsResizeDetector";
import { GobanRenderer, GobanRendererConfig } from "goban";
// Pull this out its own util
import { goban_view_mode } from "Game/util";
//import { generateGobanHook } from "Game/GameHooks";

import { usePreference } from "preferences";

interface GobanContainerProps {
    goban?: GobanRenderer;
    /** callback that is called when the goban detects a resize. */
    onResize?: () => void;
    /** Additional props to pass to the PersistentElement that wraps the goban_div */
    extra_props?: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
}

/**
 * Takes a GobanCore and its div element, and handles resizes as necessary.
 */
export function GobanContainer({
    goban,
    onResize: onResizeCb,
    extra_props,
}: GobanContainerProps): JSX.Element {
    const ref_goban_container = React.useRef<HTMLDivElement>(null);
    const resize_debounce = React.useRef<NodeJS.Timeout | null>(null);
    const [last_move_opacity] = usePreference("last-move-opacity");

    const goban_div = (goban?.config as GobanRendererConfig | undefined)?.board_div;

    const recenterGoban = () => {
        if (!ref_goban_container.current || !goban || !goban_div) {
            return;
        }
        const m = goban.computeMetrics();
        $(goban_div).css({
            top: Math.ceil(ref_goban_container.current.offsetHeight - m.height) / 2,
            left: Math.ceil(ref_goban_container.current.offsetWidth - m.width) / 2,
        });
    };
    const onResize = React.useCallback(
        (no_debounce: boolean = false, do_cb: boolean = true) => {
            if (!goban || !goban_div) {
                return;
            }

            // Allow the consumer of this component to specify additional work
            // that should be done when the goban container detects a resize.
            if (do_cb && onResizeCb) {
                onResizeCb();
            }

            if (resize_debounce.current) {
                clearTimeout(resize_debounce.current);
                resize_debounce.current = null;
            }

            if (!ref_goban_container.current) {
                return;
            }

            if (goban_view_mode() === "portrait") {
                const w = $(window).width() + 10;
                if (ref_goban_container.current.style.minHeight !== `${w}px`) {
                    ref_goban_container.current.style.minHeight = `${w}px`;
                }
            } else {
                if (ref_goban_container.current.style.minHeight !== `initial`) {
                    ref_goban_container.current.style.minHeight = `initial`;
                }
                const w = ref_goban_container.current.offsetWidth;
                if (ref_goban_container.current.style.flexBasis !== `${w}px`) {
                    ref_goban_container.current.style.flexBasis = `${w}px`;
                }
            }

            goban.setLastMoveOpacity(last_move_opacity);
            if (no_debounce) {
                // Debouncing is necessary because setting the square size can be an expensive operation.
                goban.setSquareSizeBasedOnDisplayWidth(
                    Math.min(
                        ref_goban_container.current.offsetWidth,
                        ref_goban_container.current.offsetHeight,
                    ),
                );
            } else {
                resize_debounce.current = setTimeout(() => onResize(true), 10);
            }

            recenterGoban();
        },
        [goban, goban_div, onResizeCb],
    );

    // Trigger resize on createGoban and subsequent "load" events
    //generateGobanHook(() => onResize(/* no_debounce */ true, /* do_cb */ false))(goban || null);

    if (!goban || !goban_div) {
        return <React.Fragment />;
    }

    return (
        <div ref={ref_goban_container} className="goban-container">
            <OgsResizeDetector onResize={onResize} targetRef={ref_goban_container} />
            <PersistentElement className="Goban" elt={goban_div} extra_props={extra_props} />
        </div>
    );
}
