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
import { PersistentElement } from "@/components/PersistentElement";
import { OgsResizeDetector } from "@/components/OgsResizeDetector";
import { GobanRenderer, GobanRendererConfig } from "goban";
// Pull this out its own util
import { goban_view_mode } from "@/views/Game/util";
//import { generateGobanHook } from "@/views/Game/GameHooks";

import { usePreference } from "@/lib/preferences";
import { useGobanControllerOrNull } from "@/views/Game/goban_context";
import * as data from "@/lib/data";
import { GobanTransformSetting } from "@/lib/GobanController";

interface GobanContainerProps {
    /** The goban to render. If not provided, the goban context goban will be used */
    goban?: GobanRenderer;
    /** callback that is called when the goban detects a resize. */
    onResize?: () => void;
    /** callback that is called when user scrolls on goban container. */
    onWheel?: React.WheelEventHandler<HTMLDivElement> | undefined;
    /** Additional props to pass to the PersistentElement that wraps the goban_div */
    extra_props?: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
}

/**
 * Takes a Goban and its div element, and handles resizes as necessary.
 */
export function GobanContainer({
    goban,
    onResize: onResizeCb,
    onWheel,
    extra_props,
}: GobanContainerProps): React.ReactElement {
    const goban_controller = useGobanControllerOrNull();
    const ref_goban_container = React.useRef<HTMLDivElement>(null);
    const resize_debounce = React.useRef<NodeJS.Timeout | null>(null);
    const [last_move_opacity] = usePreference("last-move-opacity");

    if (!goban) {
        goban = goban_controller?.goban;
    }

    const goban_div = (goban?.config as GobanRendererConfig | undefined)?.board_div;

    const recenterGoban = () => {
        if (!ref_goban_container.current || !goban || !goban_div) {
            return;
        }
        const m = goban.computeMetrics();
        goban_div.style.top = `${
            Math.ceil(ref_goban_container.current.offsetHeight - m.height) / 2
        }px`;
        goban_div.style.left = `${
            Math.ceil(ref_goban_container.current.offsetWidth - m.width) / 2
        }px`;
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

            const view_mode = goban_view_mode();

            if (view_mode === "portrait") {
                const w = window.innerWidth + 10;
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

    React.useEffect(() => {
        if (!goban || !goban_div || !ref_goban_container.current) {
            return;
        }
        onResize(/* no_debounce */ true, /* do_cb */ true);
    }, [goban, goban_div, ref_goban_container.current, onResize]);

    React.useEffect(() => {
        if (!goban || !goban_div || !ref_goban_container.current) {
            return;
        }
        if (!goban.engine.game_id) {
            return;
        }
        const gobanTransformArray: GobanTransformSetting[] | undefined =
            data.get("goban-transform");
        if (gobanTransformArray) {
            const transformValue = gobanTransformArray.find((e) => e.game === goban.engine.game_id)
                ?.transform;
            if (transformValue) {
                goban_div.style.transform = `rotate(${transformValue}deg)`;
            }
        }
    }, []);

    if (!goban || !goban_div) {
        return <React.Fragment />;
    }

    return (
        <div ref={ref_goban_container} className="goban-container" onWheel={onWheel}>
            <OgsResizeDetector onResize={onResize} targetRef={ref_goban_container} />
            <PersistentElement className="Goban" elt={goban_div} extra_props={extra_props} />
        </div>
    );
}
