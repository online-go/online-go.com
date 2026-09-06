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
import { Goban, GobanEvents } from "goban";
import { GobanController } from "@/lib/GobanController";
import * as preferences from "@/lib/preferences";
import { ViewMode, goban_view_mode, stageFitsWithSlider } from "./util";

/**
 * Generates a custom react hook that returns a prop derived from a goban object.
 * It triggers an update on any of the specified events, in addition to the
 * first time it is called and when the goban first loads.
 */
export function generateGobanHook<T, G extends Goban | null>(
    deriveProp: (goban: G) => T,
    events: Array<keyof Omit<GobanEvents, "load">> = [],
): (goban: G) => T {
    return (goban: G) => {
        const [prop, setProp] = React.useState(deriveProp(goban));
        React.useEffect(() => {
            const syncProp = () => {
                setProp(deriveProp(goban));
            };
            syncProp();

            if (!goban) {
                return;
            }

            return subscribeAllEvents(goban, events, syncProp);
        }, [goban]);
        return prop;
    };
}

export function subscribeAllEvents(
    goban: Goban,
    events: Array<keyof Omit<GobanEvents, "load">> = [],
    cb: () => void,
) {
    const events_with_load: Array<keyof GobanEvents> = ["load", ...events];
    for (const e of events_with_load) {
        goban.on(e, cb);
    }
    return () => {
        for (const e of events_with_load) {
            goban.off(e, cb);
        }
    };
}

export function useViewMode(controller: GobanController | null): ViewMode {
    const [view_mode, set_view_mode] = React.useState(controller?.view_mode ?? goban_view_mode());
    React.useEffect(() => {
        if (controller) {
            controller.on("view_mode", set_view_mode);
            return () => {
                controller.off("view_mode", set_view_mode);
            };
        }
        return undefined;
    }, [controller]);
    return view_mode;
}

export function useZenMode(controller: GobanController | null): boolean {
    const [zen_mode, set_zen_mode] = React.useState(
        controller?.zen_mode ?? preferences.get("start-in-zen-mode"),
    );
    React.useEffect(() => {
        if (!controller) {
            return;
        }

        controller.on("zen_mode", set_zen_mode);
        return () => {
            controller.off("zen_mode", set_zen_mode);
        };
    }, [controller]);
    return zen_mode;
}

export interface SliderFitRefs {
    /** The GobanView root; the rendered slider strip is found under it. */
    root: React.RefObject<HTMLDivElement | null>;
    /** The portrait scroll area, whose height the slider row is taken from. */
    scroll: React.RefObject<HTMLDivElement | null>;
    above: React.RefObject<HTMLDivElement | null>;
    /** The board column; its width is the board's full size. */
    center: React.RefObject<HTMLDivElement | null>;
    below: React.RefObject<HTMLDivElement | null>;
}

/** Height of the MoveNumberControl strip in rem, used until the strip has
 *  been rendered and measured. Matches the room GobanView.css reserves for
 *  the strip above a takeover; a slight overestimate only errs towards
 *  hiding the strip. */
const SLIDER_FALLBACK_HEIGHT_REM = 2.6;

/**
 * Portrait only: whether the board stage (the above/below slots and the
 * board at its full width) still fits in the scroll area, without the board
 * shrinking, when the move slider takes its row above the tab bar.
 *
 * The layout is measured with a ResizeObserver, so the answer follows
 * viewport changes and content changes in the slots. Showing the slider
 * moves its height out of the scroll area, so the measurement adds it back
 * and the answer is the same whether the slider is currently shown or not.
 * The slider's height is read from the strip once it has been rendered;
 * before that a fallback matching its CSS is used.
 */
export function useSliderFits(refs: SliderFitRefs, enabled: boolean): boolean {
    const [fits, set_fits] = React.useState(false);
    const measured_slider_height = React.useRef<number | null>(null);

    React.useLayoutEffect(() => {
        if (!enabled) {
            return;
        }

        const measure = () => {
            const root = refs.root.current;
            const scroll = refs.scroll.current;
            const center = refs.center.current;
            if (!root || !scroll || !center) {
                return;
            }

            const slider = root.querySelector<HTMLElement>(":scope > .MoveNumberControl");
            if (slider) {
                measured_slider_height.current = Math.max(
                    measured_slider_height.current ?? 0,
                    slider.offsetHeight,
                );
            }
            const slider_height =
                measured_slider_height.current ??
                SLIDER_FALLBACK_HEIGHT_REM *
                    parseFloat(getComputedStyle(document.documentElement).fontSize);

            const next = stageFitsWithSlider({
                available: scroll.clientHeight + (slider?.offsetHeight ?? 0),
                slider: slider_height,
                slots:
                    (refs.above.current?.offsetHeight ?? 0) +
                    (refs.below.current?.offsetHeight ?? 0),
                board: center.offsetWidth,
            });
            set_fits((prev) => (prev === next ? prev : next));
        };

        measure();
        if (typeof ResizeObserver === "undefined") {
            return;
        }

        const observer = new ResizeObserver(measure);
        for (const ref of [refs.root, refs.scroll, refs.above, refs.center, refs.below]) {
            if (ref.current) {
                observer.observe(ref.current);
            }
        }
        return () => observer.disconnect();
    }, [enabled]);

    return enabled && fits;
}
