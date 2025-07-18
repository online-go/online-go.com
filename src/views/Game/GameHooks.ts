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
import { ConditionalMoveTree, Goban } from "goban";
import { GobanEvents } from "goban";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { useGobanController } from "./goban_context";
import { GobanController } from "@/lib/GobanController";
import { ViewMode } from "./util";
import { ChatMode } from "./GameChat";

/**
 * Generates a custom react hook that can return a prop that is derived from a
 * goban object.  It trigger an update on any of the specified events, in
 * addition to the first time it is called and when the goban first loads.
 * @param deriveProp a function that takes in a Goban-like object and returns a value.
 * @param events a list of events that should trigger a recalculation of this value.
 * @returns a React Hook.
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

/**
 * @param goban the goban object
 * @param events the events to which we want to subscribe (excluding load)
 * @param cb the callback which should be triggered on emit.
 * @returns a callback that will unsubscribe from all events that were just subscribed.
 */
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

/** React hook that returns true if an undo was requested on the current move */
export function useShowUndoRequested(goban: Goban): boolean {
    const [show_undo_requested, setShowUndoRequested] = React.useState(
        !!goban &&
            goban.engine.undo_requested === goban.engine.last_official_move.move_number &&
            goban.engine.undo_requested === goban.engine.cur_move.move_number,
    );
    const goban_controller = useGobanController();
    const [in_pushed_analysis, set_in_pushed_analysis] = React.useState(
        goban_controller.in_pushed_analysis,
    );

    React.useEffect(() => {
        goban_controller.on("in_pushed_analysis", set_in_pushed_analysis);
        return () => {
            goban_controller.off("in_pushed_analysis", set_in_pushed_analysis);
        };
    }, [goban_controller]);

    React.useEffect(() => {
        if (!goban) {
            return;
        }

        const syncShowUndoRequested = () => {
            if (in_pushed_analysis) {
                return;
            }

            setShowUndoRequested(
                goban.engine.undo_requested === goban.engine.last_official_move.move_number &&
                    goban.engine.undo_requested === goban.engine.cur_move.move_number,
            );
        };
        syncShowUndoRequested();

        goban.on("load", syncShowUndoRequested);
        goban.on("undo_requested", syncShowUndoRequested);
        goban.on("undo_canceled", syncShowUndoRequested);
        goban.on("last_official_move", syncShowUndoRequested);
        goban.on("cur_move", syncShowUndoRequested);

        return () => {
            goban.off("load", syncShowUndoRequested);
            goban.off("undo_requested", syncShowUndoRequested);
            goban.off("undo_canceled", syncShowUndoRequested);
            goban.off("last_official_move", syncShowUndoRequested);
            goban.off("cur_move", syncShowUndoRequested);
        };
    }, [goban, in_pushed_analysis]);

    return show_undo_requested;
}

/** React hook that returns true if user is a participant in this game */
export const useUserIsParticipant = generateGobanHook((goban: Goban | null) => {
    const user = data.get("user");
    if (!goban || !user) {
        return false;
    }
    return goban.engine.isParticipant(user.id);
});

/** React hook that returns the current move number from goban */
export const useCurrentMoveNumber = generateGobanHook(
    (goban: Goban | null) => goban?.engine.cur_move?.move_number || -1,
    ["cur_move"],
);

/** React hook that returns the phase */
export const usePhase = generateGobanHook((goban: Goban | null) => goban?.engine.phase, ["phase"]);

/** React hook that returns the current move tree from goban */
export const useCurrentMove = generateGobanHook(
    (goban: Goban | null) => goban?.engine.cur_move,
    ["cur_move"],
);

/** React hook that returns the current player whose move it is.
 *
 * @returns the player ID of the player whose turn it is.
 */
export const usePlayerToMove = generateGobanHook(
    (goban: Goban | null) => goban?.engine.playerToMove() ?? 0,
    ["cur_move", "last_official_move"],
);

/** React hook that returns true if the title should be shown. */
export const useShowTitle = generateGobanHook(
    (goban: Goban | null) => {
        if (!goban) {
            return false;
        }
        return !goban.submit_move || goban.engine.playerToMove() !== data.get("user")?.id || null;
    },
    ["cur_move", "submit_move"],
);

/** React hook that returns the title text (e.g. "Black to move"). */
export const useTitle = generateGobanHook((goban: Goban | null) => goban?.title, ["title"]);
export const useMode = generateGobanHook((goban: Goban | null) => goban?.mode, ["mode"]);

export function useViewMode(controller: GobanController | null): ViewMode {
    const [view_mode, set_view_mode] = React.useState(controller?.view_mode ?? "wide");
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

export function useVariationName(controller: GobanController | null): string {
    const [variation_name, set_variation_name] = React.useState(controller?.variation_name ?? "");
    React.useEffect(() => {
        if (controller) {
            controller.on("set_variation_name", set_variation_name);
            return () => {
                controller.off("set_variation_name", set_variation_name);
            };
        }
        return undefined;
    }, [controller]);
    return variation_name;
}

export function useSelectedChatLog(controller: GobanController): ChatMode {
    const [selected_chat_log, set_selected_chat_log] = React.useState(controller.selected_chat_log);
    React.useEffect(() => {
        if (!controller) {
            return;
        }

        controller.on("selected_chat_log", set_selected_chat_log);
        return () => {
            controller.off("selected_chat_log", set_selected_chat_log);
        };
    }, [controller]);
    return selected_chat_log;
}

export function useAnnulled(controller: GobanController): boolean {
    const [annulled, set_annulled] = React.useState(controller.annulled);
    React.useEffect(() => {
        controller.on("annulled", set_annulled);
        return () => {
            controller.off("annulled", set_annulled);
        };
    }, [controller]);
    return annulled;
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

export function useStashedConditionalMoves(
    controller: GobanController,
): ConditionalMoveTree | null {
    const [stashed_conditional_moves, set_stashed_conditional_moves] = React.useState(
        controller?.stashed_conditional_moves ?? null,
    );
    React.useEffect(() => {
        controller.on("stashed_conditional_moves", set_stashed_conditional_moves);
        return () => {
            controller.off("stashed_conditional_moves", set_stashed_conditional_moves);
        };
    }, [controller]);
    return stashed_conditional_moves;
}

export function useAIReviewEnabled(controller: GobanController): boolean {
    const [ai_review_enabled, set_ai_review_enabled] = React.useState(
        controller?.ai_review_enabled ?? preferences.get("ai-review-enabled"),
    );
    React.useEffect(() => {
        controller.on("ai_review_enabled", set_ai_review_enabled);
    }, [controller]);
    return ai_review_enabled;
}
