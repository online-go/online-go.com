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
import { ViewMode, goban_view_mode } from "./util";

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
