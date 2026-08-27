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
import {
    ConditionalMoveTree,
    Goban,
    GobanRenderer,
    JGOFClockWithTransmitting,
    JGOFPauseState,
} from "goban";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { useGobanController } from "@/components/GobanView";
import { GobanController } from "@/lib/GobanController";
import { useUser } from "@/lib/hooks";
import { ChatMode } from "./GameChat";

// Shared hooks live in GobanView; import locally and re-export for callers.
import {
    generateGobanHook,
    subscribeAllEvents,
    useViewMode,
    useZenMode,
} from "@/components/GobanView/hooks";
export { generateGobanHook, subscribeAllEvents, useViewMode, useZenMode };

/**
 * Score-details popup state shared by the PlayerCards wrapper and the Game
 * view's mobile player cards. Opening the popup temporarily paints
 * the current score onto the board (stashing the move's marks); closing it
 * restores the previous marks and score visibility.
 */
export function useScorePopup(goban: Goban | null): {
    show_score_breakdown: boolean;
    toggleScorePopup: () => void;
} {
    const orig_marks = React.useRef<string | null>(null);
    const showing_scores = React.useRef<boolean>(false);
    const [show_score_breakdown, set_show_score_breakdown] = React.useState(false);

    const popupScores = () => {
        if (!goban) {
            return;
        }
        if (goban.engine.cur_move) {
            orig_marks.current = JSON.stringify(goban.engine.cur_move.getAllMarks());
            goban.engine.cur_move.clearMarks();
        } else {
            orig_marks.current = null;
        }

        const scores = goban.engine.computeScore(false);
        showing_scores.current = goban.showing_scores;
        goban.showScores(scores);

        set_show_score_breakdown(true);
    };
    const hideScores = () => {
        if (!goban) {
            return;
        }
        if (!showing_scores.current) {
            goban.hideScores();
        }
        if (goban.engine.cur_move && orig_marks.current) {
            goban.engine.cur_move.setAllMarks(JSON.parse(orig_marks.current));
        }
        goban.redraw();

        set_show_score_breakdown(false);
    };

    const toggleScorePopup = () => (show_score_breakdown ? hideScores() : popupScores());

    return { show_score_breakdown, toggleScorePopup };
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

/** React hook that returns "cancel" while the game is still young enough to
 *  be cancelled outright, and "resign" after that. */
export const useResignMode = generateGobanHook(
    (goban: Goban | null): "cancel" | "resign" =>
        goban?.engine.gameCanBeCancelled() ? "cancel" : "resign",
    ["cur_move"],
);

/** React hook that returns true when the user may ask the opponent to take
 *  back the last official move right now. */
export const useCanRequestUndo = generateGobanHook(
    (goban: Goban | null) => {
        const user = data.get("user");
        if (!goban || !user) {
            return false;
        }
        const engine = goban.engine;
        return (
            !engine.rengo &&
            engine.isParticipant(user.id) &&
            engine.cur_move.move_number === engine.last_official_move.move_number &&
            engine.cur_move.move_number >= 1 &&
            (engine.undo_requested ?? -1) < engine.getMoveNumber() &&
            goban.submit_move == null
        );
    },
    ["cur_move", "last_official_move", "submit_move", "undo_requested", "undo_canceled"],
);

/** React hook that returns true when the opponent has an undo request
 *  pending on the current move and this user is the one who can accept or
 *  reject it. */
export function useCanAnswerUndoRequest(goban: Goban): boolean {
    const goban_controller = useGobanController();
    const user_id = data.get("user")?.id;
    const [in_pushed_analysis, set_in_pushed_analysis] = React.useState(
        goban_controller.in_pushed_analysis,
    );
    const [can_answer, set_can_answer] = React.useState(false);

    React.useEffect(() => {
        goban_controller.on("in_pushed_analysis", set_in_pushed_analysis);
        return () => {
            goban_controller.off("in_pushed_analysis", set_in_pushed_analysis);
        };
    }, [goban_controller]);

    React.useEffect(() => {
        const syncCanAnswer = () => {
            if (in_pushed_analysis || user_id === undefined) {
                set_can_answer(false);
                return;
            }

            if (!goban.engine.undo_requested || !goban.engine.isParticipant(user_id)) {
                set_can_answer(false);
                return;
            }

            const requested_by = goban.engine.undo_requested_by;
            if (requested_by !== undefined) {
                set_can_answer(requested_by !== user_id);
                return;
            }

            // Older games don't record who asked, so fall back to "the side
            // that would be undoing its own move can't be the requester".
            set_can_answer(
                goban.engine.playerToMove() === user_id ||
                    (goban.submit_move != null && goban.engine.playerNotToMove() === user_id),
            );
        };
        syncCanAnswer();

        return subscribeAllEvents(
            goban,
            ["cur_move", "submit_move", "undo_requested", "undo_canceled"],
            syncCanAnswer,
        );
    }, [goban, in_pushed_analysis, user_id]);

    const show_undo_requested = useShowUndoRequested(goban);

    return show_undo_requested && can_answer;
}

/** React hook that returns true when an undo request this user made is
 *  pending on the current move. The action-bar undo button toggles off in
 *  that state, so pressing it again cancels the request. */
export const useUndoRequestIsMine = generateGobanHook(
    (goban: Goban | null) => {
        const user = data.get("user");
        if (!goban || !user) {
            return false;
        }
        const engine = goban.engine;
        return (
            engine.undo_requested !== undefined &&
            engine.undo_requested === engine.last_official_move.move_number &&
            engine.undo_requested === engine.cur_move.move_number &&
            engine.undo_requested_by === user.id
        );
    },
    ["cur_move", "last_official_move", "undo_requested", "undo_canceled"],
);

/** React hook that returns true while the user has staged a move on the
 *  board (submit-move / double-click confirmation modes) that has not been
 *  submitted yet. */
export const useHasStagedMove = generateGobanHook(
    (goban: Goban | null) => !!goban && goban.submit_move != null,
    ["submit_move"],
);

/** React hook that returns the current move number from goban */
export const useCurrentMoveNumber = generateGobanHook(
    (goban: Goban | null) => goban?.engine.cur_move?.move_number ?? -1,
    ["cur_move"],
);

/** React hook that returns the phase */
export const usePhase = generateGobanHook((goban: Goban | null) => goban?.engine.phase, ["phase"]);

/**
 * Pause/resume control for the game clock. `action` is non-null only for
 * users allowed to change the pause state right now:
 *
 *   - unpaused → "pause" for a participant in a vacation-eligible game
 *     still in progress, or for a moderator;
 *   - paused by a player → "resume" for participants and moderators;
 *   - paused by a moderator → "resume" for moderators only;
 *   - any other pause (weekend, vacation, server, stone removal) is not
 *     user-resumable, so `action` is null.
 *
 * Moderators bypass the vacation / participant gating that applies to
 * players — `disable_vacation` only constrains player-side pauses, and
 * the server stamps the pause as `moderator_paused` regardless. This
 * gives moderators a pause affordance without a dedicated mod-tools
 * button.
 */
export function usePauseControl(goban: GobanRenderer | null): {
    paused: boolean;
    action: "pause" | "resume" | null;
    togglePause: () => void;
} {
    const user = useUser();
    const engine = goban?.engine;
    const phase = usePhase(goban);
    const user_is_player =
        !user.anonymous &&
        !!engine &&
        (user.id === engine.players.black?.id || user.id === engine.players.white?.id);
    const can_pause =
        !!goban &&
        !goban.review_id &&
        phase !== "finished" &&
        ((user_is_player && !engine?.config.disable_vacation) || !!user?.is_moderator);

    const [pause_state, set_pause_state] = React.useState<JGOFPauseState | null>(null);
    React.useEffect(() => {
        set_pause_state(null);
        if (!goban) {
            return undefined;
        }
        const onClock = (clock: JGOFClockWithTransmitting | null) => {
            set_pause_state(clock?.pause_state ?? null);
        };
        goban.on("clock", onClock);
        return () => {
            goban.off("clock", onClock);
        };
    }, [goban]);

    const paused = !!pause_state;
    const can_resume = pause_state?.player
        ? user_is_player || !!user?.is_moderator
        : pause_state?.moderator
          ? !!user?.is_moderator
          : false;
    const action: "pause" | "resume" | null = paused
        ? can_resume
            ? "resume"
            : null
        : can_pause
          ? "pause"
          : null;

    const togglePause = () => {
        if (!goban) {
            return;
        }
        if (paused) {
            goban.resumeGame();
        } else {
            goban.pauseGame();
        }
    };

    return { paused, action, togglePause };
}

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
export const useWinner = generateGobanHook(
    (goban: Goban | null) => goban?.engine.winner,
    ["winner"],
);

export function useVariationName(controller: GobanController | null): string {
    const [variation_name, set_variation_name] = React.useState(controller?.variation_name ?? "");
    React.useEffect(() => {
        if (controller) {
            controller.on("variation_name", set_variation_name);
            return () => {
                controller.off("variation_name", set_variation_name);
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
        return () => {
            controller.off("ai_review_enabled", set_ai_review_enabled);
        };
    }, [controller]);
    return ai_review_enabled;
}
